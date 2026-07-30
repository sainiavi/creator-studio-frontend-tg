import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Rocket,
  Bot,
  Loader2,
  Check,
  Play,
  ArrowRight,
  Zap,
  Crown,
  Wand2,
  Sparkles,
} from "lucide-react";

// Three quality tiers. The tier the user taps owns the models AND the strategy
// on the backend (Tier 1 = hybrid seed-edit, Tier 2 & 3 = fully agentic from
// scratch), so the button only needs to send the tier number.
const tierButtons = [
  {
    tier: 1 as const,
    label: "HYBRID",
    subtitle: "Fast build from a proven template. Best value.",
    icon: Bot,
    iconColor: "text-cyan-200",
    gradient: "bg-[linear-gradient(135deg,#a855f7,#6d28d9)]",
  },
  {
    tier: 2 as const,
    label: "PRO",
    subtitle: "Fully AI-built from scratch. Stronger results.",
    icon: Zap,
    iconColor: "text-pink-100",
    gradient: "bg-[linear-gradient(135deg,#ec4899,#7e22ce)]",
  },
  {
    tier: 3 as const,
    label: "ULTRA",
    subtitle: "Best models, best game. Premium.",
    icon: Crown,
    iconColor: "text-amber-200",
    gradient: "bg-[linear-gradient(135deg,#f59e0b,#db2777)]",
  },
];
import { useStudioContext } from "@/context/StudioContext";
import { api, clearAuthToken, prefetchAuthToken } from "@/lib/api";
import { findGameTemplate } from "@/lib/templates-loader";
import { engineOf, getThumbnailUrl, templateEmoji } from "@/lib/studio-meta";
import { sendTonGenerationPayment } from "@/lib/tonPayment";
import { createGenerationStarsOrder, fetchStarsOrder } from "@/lib/api/stars";
import { isTelegramMiniApp, openTelegramInvoice } from "@/lib/telegramMiniApp";
import { getStudioChainPaymentMethod } from "@/lib/studioPaymentMethod";
import { getTonWallet } from "@/lib/tonWallet";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useStudioAuth } from "@/hooks/useStudioAuth";
import { getWalletAddress } from "@/lib/identity";
import { usePrivyEvmWallet } from "@/lib/usePrivyEvmWallet";
import {
  formatZeroGShortfall,
  hasSufficientZeroGBalance,
} from "@/lib/zeroGSubscriptionCheckout";
import { isWalletLinkedOnSession } from "@/lib/walletLink";
import { getWalletErrorPresentation, isWalletUserAbort } from "@/lib/walletErrors";
import { parseHumanZeroGAmount } from "@/lib/zeroGChain";
import { CreatePageSkeleton } from "@/components/studio/PageSkeletons";
import { AppHeader } from "@/components/studio/AppHeader";
import { ConsoleChatMessages } from "@/components/studio/ConsoleChatMessages";
import { CreateConsolePanel } from "@/components/studio/CreateConsolePanel";
import { ZeroGWalletPanel } from "@/components/studio/ZeroGWalletPanel";
import { useCreateChatFlow } from "@/hooks/useCreateChatFlow";
import buildIcon from "@/assets/buildIcon.png";
import consoleIcon from "@/assets/consoleIcon.png";
import {
  fetchCreatorSubscriptionTiers,
  purchaseCreatorSubscription,
} from "@/lib/api/creatorSubscription";
import { publishGamePackage } from "@/lib/api/publishGame";

export const Route = createFileRoute("/_app/create")({
  pendingComponent: CreatePageSkeleton,
  head: () => ({
    meta: [
      { title: "Create — Creator Studio" },
      {
        name: "description",
        content: "Describe your game in a prompt and let the agent build a playable version.",
      },
    ],
  }),
  component: Create,
});

const steps = [
  "Submitting prompt",
  "Writing game code",
  "Testing & repairing",
  "Playable build ready",
];
const PENDING_CHAIN_GENERATION_PAYMENT_KEY = "kult-pending-chain-generation-payment";

const stageToStep: Record<string, number> = {
  "writing-code": 1,
  "editing-seed": 1,
  repairing: 2,
  "fixing-syntax": 2,
  "fixing-runtime": 2,
};

function Create() {
  const { studio, addCreatedGame, removeCreatedGame } = useStudioContext();
  const { ready: authReady, authenticated, user, openLogin, syncWalletIdentity } = useStudioAuth();
  const { signRawHash } = useSignRawHash();
  const { ensureEvmWallet, getEthereumProvider, sendZeroGGenerationPayment, addZeroGFunds, readZeroGBalance, linkWalletOnZeroGChain } =
    usePrivyEvmWallet();
  const navigate = useNavigate();
  const [templateSeed, setTemplateSeed] = useState<any | null>(null);
  const chat = useCreateChatFlow({
    onPromptChange: (prompt) => studio.setPrompt(prompt),
  });
  const {
    messages,
    setMessages,
    chatStage,
    setChatStage,
    chatInput,
    setChatInput,
    gameRequest,
    setGameRequest,
    finalPrompt,
    setFinalPrompt,
    sendChat,
    submitComposerPrompt: submitChatPrompt,
    chatPrompt,
    isThinking,
    resetChat,
  } = chat;
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [generationNotice, setGenerationNotice] = useState("");
  const [generationNoticeKind, setGenerationNoticeKind] = useState<"info" | "payment" | "error">(
    "info",
  );
  const [isPaying, setIsPaying] = useState(false);
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [publishingGame, setPublishingGame] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [enhancedPromptDraft, setEnhancedPromptDraft] = useState("");
  // When a 2nd+ game needs payment, we hold the pending build here and let the
  // user pick TON or Telegram Stars instead of auto-charging.
  const [paymentChoice, setPaymentChoice] = useState<{
    tier: 1 | 2 | 3;
    buildPrompt: string;
    billingMode: "subscription" | "legacy";
    subscriptionTier?: 1 | 2;
    subscriptionName?: string;
    subscriptionPrice0G?: string;
    walletRequired?: boolean;
    chainMethod: "ton" | "0g";
    chainAmount: number;
    chainCurrency: string;
    starsAmount: number;
    starsAvailable: boolean;
  } | null>(null);
  const [subscriptionFunded, setSubscriptionFunded] = useState<boolean | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const subscriptionCheckoutKeyRef = useRef<string | null>(null);

  // The build itself lives in studio state + localStorage (kult-active-build),
  // so it survives navigating away and full page refreshes. This page only
  // renders whatever build is active until the user cancels/dismisses it.
  const activeBuild = studio.activeBuild;
  const phase: "idle" | "building" | "done" | "failed" = activeBuild ? activeBuild.phase : "idle";
  const buildingTier = phase === "building" ? activeBuild!.tier : null;
  const builtGame = activeBuild?.game ?? null;
  const builtGameId = builtGame?.id ?? studio.generatedPackage?.id ?? null;
  const canPickBuildTier = chatStage === "ready" && phase !== "building";
  // Re-render once a second while building so the elapsed time and step list move
  // even between 5s job polls.
  const [, setTick] = useState(0);
  useEffect(() => {
    const templateId = sessionStorage.getItem("kult-create-template-id");
    if (templateId) {
      sessionStorage.removeItem("kult-create-template-id");
      void findGameTemplate(templateId).then((template) => {
        if (!template) return;
        setTemplateSeed(template);
        studio.setEngine(engineOf(template));
        studio.setSelectedId(template.id);
        const category = String(template.category ?? "arcade").toLowerCase();
        const basePrompt = `Create a game like ${template.name}. Keep the core ${category} template feel: ${template.mechanic}`;
        setGameRequest(basePrompt);
        setChatStage("vibe");
        setMessages([
          {
            role: "assistant",
            text: `${template.name} is selected as your template. Tell me what theme, characters, rules, or difficulty changes you want.`,
          },
          { role: "user", text: basePrompt },
        ]);
        studio.setPrompt(basePrompt);
      });
      return;
    }

    const remixPrompt = sessionStorage.getItem("kult-remix-prompt");
    if (remixPrompt) {
      sessionStorage.removeItem("kult-remix-prompt");
      setGameRequest(remixPrompt);
      setChatStage("vibe");
      setMessages([
        { role: "assistant", text: "Remix loaded. What theme or character swap do you want?" },
        { role: "user", text: remixPrompt },
      ]);
      studio.setPrompt(remixPrompt);
      return;
    }

    const heroPrompt = sessionStorage.getItem("kult-create-prompt");
    if (heroPrompt) {
      sessionStorage.removeItem("kult-create-prompt");
      studio.setPrompt(heroPrompt);
      setGameRequest(heroPrompt);
      setFinalPrompt(heroPrompt);
      setChatStage("ready");
      setMessages([
        { role: "assistant", text: "Hey there! What kind of game do you want to create?" },
        { role: "user", text: heroPrompt.split(".")[0] ?? heroPrompt },
        { role: "assistant", text: heroPrompt },
        {
          role: "assistant",
          text: "Plan ready! Choose Hybrid Mode or Pure Agent Strategy below to start building.",
        },
      ]);
    }
  }, [studio, setChatStage, setFinalPrompt, setGameRequest, setMessages]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (phase !== "building") return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const elapsedSec = activeBuild
    ? Math.max(0, Math.floor((Date.now() - activeBuild.startedAt) / 1000))
    : 0;
  const step =
    phase === "building" ? (stageToStep[activeBuild?.progressStage ?? ""] ?? 0) : steps.length - 1;

  const showNotice = (message: string, kind: "info" | "payment" | "error" = "info") => {
    setGenerationNotice(message);
    setGenerationNoticeKind(kind);
    requestAnimationFrame(() => {
      noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const requireLogin = () => {
    if (!authReady) return false;
    if (authenticated && user) return true;
    showNotice("Sign in to generate and save your game.");
    void openLogin();
    return false;
  };

  useEffect(() => {
    if (phase !== "failed") return;
    const statusText = activeBuild?.statusText ?? studio.agentStatus ?? "";
    if (!statusText) return;
    if (/free game|TON|payment required|subscription|required|generate another/i.test(statusText)) {
      setGenerationNotice(statusText);
      setGenerationNoticeKind("payment");
    } else if (!generationNotice) {
      setGenerationNotice(statusText);
      setGenerationNoticeKind("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeBuild?.statusText]);

  useEffect(() => {
    if (!paymentChoice || paymentChoice.billingMode !== "subscription") {
      setSubscriptionFunded(null);
      return;
    }
    let cancelled = false;
    void readZeroGBalance()
      .then((balance) => {
        if (cancelled) return;
        setSubscriptionFunded(
          hasSufficientZeroGBalance(balance, paymentChoice.subscriptionPrice0G),
        );
      })
      .catch(() => {
        if (!cancelled) setSubscriptionFunded(null);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentChoice, readZeroGBalance]);

  const formatPaidGenerationNotice = (error: any) => {
    const data = error?.response?.data;
    const payment = data?.payment;
    const amount = payment?.amount ?? 1;
    const currency = payment?.currency ?? "TON";
    const existing = Number(payment?.existingGames ?? 0);
    const serverError = String(data?.error ?? "").trim();
    if (data?.code === "SUBSCRIPTION_REQUIRED") {
      return (
        serverError || `${data?.subscription?.requiredTierName ?? "A subscription"} is required.`
      );
    }
    if (data?.code === "PAID_GENERATION_REQUIRED") {
      return (
        serverError ||
        `You've already created your free game${existing > 0 ? ` (${existing} so far)` : ""}. Pay ${amount} ${currency} to generate another.`
      );
    }
    return serverError || error?.message || "Could not start generation.";
  };

  type SubscriptionPaymentChoice = Extract<
    NonNullable<typeof paymentChoice>,
    { billingMode: "subscription" }
  >;

  const showWalletNotice = (error: unknown, action = "subscribe with 0G") => {
    const { message, kind } = getWalletErrorPresentation(error, { action });
    showNotice(message, kind);
  };

  const checkoutSubscription = async (
    choice: SubscriptionPaymentChoice,
    options?: { auto?: boolean },
  ): Promise<"subscribed" | "needs_funds" | "needs_wallet" | "cancelled"> => {
    await ensureEvmWallet();
    await syncWalletIdentity();

    const wallet = getWalletAddress();
    if (!wallet) {
      setPaymentChoice({ ...choice, walletRequired: true });
      if (!options?.auto) {
        showNotice("Connect your 0G wallet, then confirm the subscription.", "payment");
      }
      return "needs_wallet";
    }

    setPaymentChoice({ ...choice, walletRequired: false });

    if (!isWalletLinkedOnSession(wallet)) {
      showNotice("Sign once in your wallet on 0G to link it to your account.", "payment");
      await linkWalletOnZeroGChain();
    }

    const balance = await readZeroGBalance();
    const funding = formatZeroGShortfall(balance, choice.subscriptionPrice0G);
    if (!funding.sufficient) {
      showNotice(
        `You have ${funding.balanceLabel} but ${choice.subscriptionName ?? "this plan"} costs ${funding.priceLabel}. Top up, then confirm the subscription.`,
        "payment",
      );
      return "needs_funds";
    }

    showNotice(
      `Opening your wallet — confirm ${choice.subscriptionName ?? "Creator subscription"} for ${funding.priceLabel}.`,
      "payment",
    );
    try {
      await purchaseCreatorSubscription(choice.subscriptionTier ?? 1, 1, getEthereumProvider);
    } catch (error) {
      if (isWalletUserAbort(error)) return "cancelled";
      throw error;
    }
    return "subscribed";
  };

  type LegacyPaymentChoice = Extract<
    NonNullable<typeof paymentChoice>,
    { billingMode: "legacy" }
  >;

  const legacyCheckoutKeyRef = useRef<string | null>(null);

  const runLegacyPayThenBuild = async (choice: LegacyPaymentChoice) => {
    try {
      if (choice.chainMethod === "0g" && choice.chainAmount <= 0) {
        setIsPaying(true);
        await ensureEvmWallet();
        await syncWalletIdentity();
        const wallet = getWalletAddress();
        if (!wallet) {
          showNotice("Connect your 0G wallet to continue.", "payment");
          return;
        }
        if (!isWalletLinkedOnSession(wallet)) {
          showNotice("Sign once in your wallet on 0G to link it to your account.", "payment");
          await linkWalletOnZeroGChain();
        }
        showNotice("Wallet linked. Starting your Hybrid build…", "info");
        setPaymentChoice(null);
        const game = await studio.generateFromPrompt(choice.tier, choice.buildPrompt, {
          method: "0g",
        });
        if (game) addCreatedGame(game);
        setGenerationNotice("");
        return;
      }

      if (choice.chainMethod === "ton" && choice.chainAmount <= 0) {
        setIsPaying(true);
        const tonWallet = getTonWallet(user);
        if (!tonWallet) {
          showNotice("Connect your TON wallet in the header to continue.", "payment");
          return;
        }
        showNotice("Starting your Hybrid build…", "info");
        setPaymentChoice(null);
        const game = await studio.generateFromPrompt(choice.tier, choice.buildPrompt, {
          method: "ton",
        });
        if (game) addCreatedGame(game);
        setGenerationNotice("");
        return;
      }

      await payWithChain(choice);
    } catch (error: unknown) {
      if (isWalletUserAbort(error)) return;
      showWalletNotice(error, "pay for this game");
    } finally {
      setIsPaying(false);
    }
  };

  const runSubscriptionThenBuild = async (choice: SubscriptionPaymentChoice) => {
    try {
      const result = await checkoutSubscription(choice);
      if (result !== "subscribed") {
        if (result === "cancelled") {
          showNotice(
            "Subscription not completed. Open your wallet and approve the 10 0G payment, then click Subscribe again.",
            "payment",
          );
        }
        return;
      }
    } catch (error) {
      showWalletNotice(error, "subscribe with 0G");
      return;
    }
    showNotice("Subscription active. Starting your game build…", "info");
    setPaymentChoice(null);
    setGenerationNotice("");
    try {
      const game = await studio.generateFromPrompt(choice.tier, choice.buildPrompt);
      if (game) addCreatedGame(game);
    } catch (error: any) {
      showNotice(
        error?.response?.data?.error ??
          error?.message ??
          "Subscription succeeded but the build could not start.",
        "error",
      );
      throw error;
    }
  };

  const build = async (tier: 1 | 2 | 3, promptOverride = "") => {
    if (!requireLogin()) return;
    const pendingInput = chatInput.trim();
    const promptWithPendingInput = [finalPrompt || chatPrompt || studio.prompt, pendingInput]
      .filter(Boolean)
      .join(". ");
    const buildPrompt = promptOverride || promptWithPendingInput;
    if (!buildPrompt.trim() || phase === "building") return;
    setGenerationNotice("");
    setGenerationNoticeKind("info");
    setPaymentChoice(null);
    try {
      if (!isTelegramMiniApp()) {
        await ensureEvmWallet();
        await syncWalletIdentity();
      }
      const game = await studio.generateFromPrompt(tier, buildPrompt);
      if (game) addCreatedGame(game);
    } catch (error: any) {
      const payment = error?.response?.data?.payment;
      const isPaidRequired =
        error?.response?.status === 402 &&
        (error?.response?.data?.code === "PAID_GENERATION_REQUIRED" || Boolean(payment?.required));
      const isWalletRequired =
        error?.response?.status === 402 &&
        (error?.response?.data?.code === "EVM_WALLET_REQUIRED" ||
          error?.response?.data?.code === "TON_WALLET_REQUIRED");
      const subscription = error?.response?.data?.subscription;
      const isSubscriptionRequired =
        error?.response?.status === 402 && error?.response?.data?.code === "SUBSCRIPTION_REQUIRED";

      if (isSubscriptionRequired) {
        const requiredTier = (subscription?.requiredTier === 2 ? 2 : 1) as 1 | 2;
        const tiers = await fetchCreatorSubscriptionTiers().catch(() => null);
        const plan = tiers?.tiers?.find((item) => item.tier === requiredTier);
        const choice: SubscriptionPaymentChoice = {
          tier,
          buildPrompt,
          billingMode: "subscription",
          subscriptionTier: requiredTier,
          subscriptionName: plan?.name ?? subscription?.requiredTierName,
          subscriptionPrice0G: plan?.price0G,
          walletRequired: Boolean(subscription?.walletRequired),
          chainMethod: "0g",
          chainAmount: 0,
          chainCurrency: "0G",
          starsAmount: 0,
          starsAvailable: false,
        };
        setPaymentChoice(choice);
        showNotice(
          subscription?.walletRequired
            ? "Link your 0G wallet, then confirm your Creator subscription."
            : `Confirm ${plan?.name ?? subscription?.requiredTierName ?? "your Creator subscription"} in your wallet to continue.`,
          "payment",
        );
        const checkoutKey = `${tier}:${buildPrompt}`;
        if (subscriptionCheckoutKeyRef.current !== checkoutKey) {
          subscriptionCheckoutKeyRef.current = checkoutKey;
          void runSubscriptionThenBuild(choice).catch((checkoutError: unknown) => {
            if (isWalletUserAbort(checkoutError)) return;
            showWalletNotice(checkoutError, "subscribe with 0G");
          });
        }
      } else if (isPaidRequired || isWalletRequired) {
        const chainMethod = getStudioChainPaymentMethod();
        const chain =
          payment?.methods?.[chainMethod] ??
          payment?.methods?.chain ??
          payment?.methods?.["0g"];
        let chainAmount = 0;
        try {
          chainAmount = Number(parseHumanZeroGAmount(chain?.amount ?? payment?.amount ?? 0));
        } catch (amountError: unknown) {
          showNotice(
            amountError instanceof Error
              ? amountError.message
              : "Invalid payment amount from server. Refresh and try again.",
            "error",
          );
          return;
        }
        const tierLabel = tier === 1 ? "Hybrid" : tier === 2 ? "Pro" : "Ultra";
        const choice: LegacyPaymentChoice = {
          tier,
          buildPrompt,
          billingMode: "legacy",
          chainMethod,
          chainAmount,
          chainCurrency: chain?.currency ?? payment?.currency ?? (chainMethod === "0g" ? "0G" : "TON"),
          starsAmount: payment?.methods?.stars?.amount ?? 0,
          starsAvailable:
            Boolean(payment?.methods?.stars?.available) &&
            (payment?.methods?.stars?.amount ?? 0) > 0,
        };
        setPaymentChoice(choice);

        if (chainMethod === "0g") {
          if (chainAmount <= 0 || isWalletRequired) {
            showNotice(`Link your wallet on 0G to start ${tierLabel} (no payment for this tier).`, "payment");
          } else {
            showNotice(`Confirm ${chainAmount} 0G in your wallet to build with ${tierLabel}.`, "payment");
          }
          const checkoutKey = `${tier}:${buildPrompt}:${chainAmount}`;
          if (legacyCheckoutKeyRef.current !== checkoutKey) {
            legacyCheckoutKeyRef.current = checkoutKey;
            void runLegacyPayThenBuild(choice);
          }
          return;
        }

        if (chainAmount <= 0 || isWalletRequired) {
          showNotice(`Connect your TON wallet to start ${tierLabel} (no payment for this tier).`, "payment");
          const checkoutKey = `${tier}:${buildPrompt}:ton-link`;
          if (legacyCheckoutKeyRef.current !== checkoutKey) {
            legacyCheckoutKeyRef.current = checkoutKey;
            void runLegacyPayThenBuild(choice);
          }
          return;
        }

        showNotice("Your first game was free. Choose how to pay for another one.", "payment");
      } else {
        const serverError = String(error?.response?.data?.error ?? error?.message ?? "").trim();
        if (error?.response?.status === 401 || /authorization token/i.test(serverError)) {
          clearAuthToken();
          void prefetchAuthToken();
          showNotice("Sign in with Google or email, then try building again.", "error");
          return;
        }
        showNotice(formatPaidGenerationNotice(error), "error");
      }
    }
  };

  const topUpZeroGWallet = async () => {
    const amount = String(paymentChoice?.chainAmount || paymentChoice?.subscriptionPrice0G || "10");
    try {
      setIsFundingWallet(true);
      await ensureEvmWallet();
      await addZeroGFunds(amount);
      showNotice("Funding started. Your 0G balance may take a minute to update.", "payment");
    } catch (error: any) {
      if (!/cancel/i.test(String(error?.message ?? ""))) {
        showNotice(error?.message ?? "Could not start wallet funding.", "error");
      }
    } finally {
      setIsFundingWallet(false);
    }
  };

  const publishBuiltGame = async () => {
    if (!builtGameId || publishingGame) return;
    if (!requireLogin()) return;
    try {
      setPublishingGame(true);
      const result = await publishGamePackage(builtGameId);
      if (result.game) addCreatedGame(result.game as any);
      showNotice("Game published! Anyone can play it now.", "info");
    } catch (error: any) {
      showNotice(
        error?.response?.data?.error ?? error?.message ?? "Could not publish this game.",
        "error",
      );
    } finally {
      setPublishingGame(false);
    }
  };

  const subscribeAndBuild = async () => {
    if (!paymentChoice || paymentChoice.billingMode !== "subscription" || isPaying) return;
    const choice = paymentChoice;
    try {
      setIsPaying(true);
      subscriptionCheckoutKeyRef.current = null;
      await runSubscriptionThenBuild(choice);
    } catch (error: unknown) {
      if (isWalletUserAbort(error)) return;
      showWalletNotice(error, "subscribe with 0G");
    } finally {
      setIsPaying(false);
    }
  };

  const payWithChain = async (choiceOverride?: LegacyPaymentChoice) => {
    const choice = choiceOverride ?? paymentChoice;
    if (!choice || isPaying) return;
    const { tier, buildPrompt, chainMethod, chainAmount, chainCurrency } = choice;
    setPaymentChoice(null);
    try {
      setIsPaying(true);
      let paymentTxHash = sessionStorage.getItem(PENDING_CHAIN_GENERATION_PAYMENT_KEY) ?? "";

      if (chainMethod === "0g") {
        await ensureEvmWallet();
        await syncWalletIdentity();
        const wallet = getWalletAddress();
        if (wallet && !isWalletLinkedOnSession(wallet)) {
          showNotice("Sign once in your wallet on 0G to link it to your account.", "payment");
          await linkWalletOnZeroGChain();
        }

        if (chainAmount <= 0) {
          showNotice("Starting your Hybrid build…", "info");
          const game = await studio.generateFromPrompt(tier, buildPrompt, { method: "0g" });
          if (game) addCreatedGame(game);
          setGenerationNotice("");
          setGenerationNoticeKind("info");
          return;
        }

        if (!paymentTxHash) {
          showNotice(
            `Confirm ${chainAmount} ${chainCurrency} in your 0G wallet to unlock another game.`,
            "payment",
          );
          await ensureEvmWallet();
          paymentTxHash = await sendZeroGGenerationPayment(chainAmount);
          sessionStorage.setItem(PENDING_CHAIN_GENERATION_PAYMENT_KEY, paymentTxHash);
        }
        showNotice("Payment sent. Verifying on 0G mainnet…", "info");
        let game = null;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          try {
            game = await studio.generateFromPrompt(tier, buildPrompt, {
              method: "0g",
              paymentTxHash,
            });
            break;
          } catch (verifyError: any) {
            const waitingForConfirmation =
              verifyError?.response?.status === 402 &&
              verifyError?.response?.data?.code === "PAYMENT_NOT_CONFIRMED";
            if (!waitingForConfirmation || attempt === 2) throw verifyError;
            showNotice("Payment sent. Waiting for 0G confirmation…", "info");
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
        if (game) addCreatedGame(game);
        sessionStorage.removeItem(PENDING_CHAIN_GENERATION_PAYMENT_KEY);
        setGenerationNotice("");
        setGenerationNoticeKind("info");
        return;
      }

      const tonWallet = getTonWallet(user);
      if (!tonWallet) {
        showNotice("Connect your TON wallet in the header to pay with TON.", "payment");
        return;
      }
      if (!paymentTxHash) {
        showNotice(
          `Confirm ${chainAmount} ${chainCurrency} in your wallet to unlock another game.`,
          "payment",
        );
        paymentTxHash = await sendTonGenerationPayment({
          wallet: tonWallet,
          amountTon: chainAmount,
          signRawHash,
        });
        sessionStorage.setItem(PENDING_CHAIN_GENERATION_PAYMENT_KEY, paymentTxHash);
      }
      showNotice("Payment sent. Verifying on TON mainnet…", "info");
      let game = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          game = await studio.generateFromPrompt(tier, buildPrompt, {
            method: "ton",
            paymentTxHash,
          });
          break;
        } catch (verifyError: any) {
          const waitingForTon =
            verifyError?.response?.status === 402 &&
            verifyError?.response?.data?.code === "PAYMENT_NOT_CONFIRMED";
          if (!waitingForTon || attempt === 2) throw verifyError;
          showNotice("Payment sent. Waiting for TON confirmation…", "info");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
      if (game) addCreatedGame(game);
      sessionStorage.removeItem(PENDING_CHAIN_GENERATION_PAYMENT_KEY);
      setGenerationNotice("");
      setGenerationNoticeKind("info");
    } catch (paymentError: any) {
      showNotice(
        paymentError?.response?.data?.error ??
          paymentError?.message ??
          "Could not complete payment. Please try again.",
        "error",
      );
    } finally {
      setIsPaying(false);
    }
  };

  // Pay for the pending build with Telegram Stars, then generate. Creates an
  // invoice, opens Telegram checkout, waits for the webhook to mark it paid,
  // then generates referencing the paid order.
  const payWithStars = async () => {
    if (!paymentChoice || isPaying) return;
    const { tier, buildPrompt, starsAmount } = paymentChoice;
    setPaymentChoice(null);
    try {
      setIsPaying(true);
      showNotice("Creating Telegram Stars invoice…", "payment");
      const order = await createGenerationStarsOrder(tier);
      if (!order.invoiceUrl) throw new Error("Telegram did not return an invoice link.");
      showNotice(`Opening Telegram checkout for ${starsAmount} Stars…`, "payment");
      const status = await openTelegramInvoice(order.invoiceUrl);
      if (status === "cancelled" || status === "failed") {
        throw new Error(status === "cancelled" ? "Payment cancelled." : "Payment failed.");
      }
      showNotice("Payment received. Confirming with Telegram…", "info");
      // Wait for the bot webhook to mark the order PAID.
      let paid = false;
      for (let i = 0; i < 20; i += 1) {
        const o = await fetchStarsOrder(order.id).catch(() => null);
        if (o && (o.status === "PAID" || o.status === "FULFILLED")) {
          paid = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      if (!paid)
        throw new Error("Stars payment not confirmed yet. Tap a tier to try again in a moment.");
      const game = await studio.generateFromPrompt(tier, buildPrompt, {
        method: "stars",
        starsOrderId: order.id,
      });
      if (game) addCreatedGame(game);
      setGenerationNotice("");
      setGenerationNoticeKind("info");
    } catch (paymentError: any) {
      showNotice(
        paymentError?.response?.data?.error ??
          paymentError?.message ??
          "Could not complete Stars payment. Please try again.",
        "error",
      );
    } finally {
      setIsPaying(false);
    }
  };

  // Cancel a running build: stop polling, drop the persisted record, and delete
  // the already-saved game entry so nothing half-built lingers in My Creations.
  const cancelBuild = () => {
    const gameId = activeBuild?.game?.id;
    studio.cancelActiveBuild();
    if (phase === "building" && gameId) void removeCreatedGame(gameId);
    resetChat();
    studio.setPrompt("");
    setEnhancedPromptDraft("");
  };

  const sendChatMessage = (text = chatInput) => {
    if (phase === "building") return;
    sendChat(text);
  };

  const submitComposerPrompt = () => {
    const value = chatInput.trim();
    if (phase === "building") return;
    if (!value) return;
    if (chatStage === "ready") {
      submitChatPrompt();
      return;
    }
    sendChatMessage(value);
  };

  const handleCreatePanelSubmit = async () => {
    if (phase === "building" || isThinking || isEnhancingPrompt) return;
    const instruction = chatInput.trim();
    if (!instruction) return;
    if (!requireLogin()) return;

    // First turn the user's short idea into a build-ready specification. Only
    // after the user can see that prompt do we reveal Hybrid, Pro, and Ultra.
    const rawPrompt = instruction;
    setMessages((current) => [
      ...current,
      { role: "user", text: instruction },
    ]);
    setIsEnhancingPrompt(true);
    setGenerationNotice("");
    try {
      const { data } = await api.post(
        "/agents/enhance-prompt",
        { prompt: rawPrompt },
        // Long, detailed prompts can make MiniMax reason for longer than the
        // shared 12s API timeout. Match the backend's enhancement allowance.
        { timeout: 100_000 },
      );
      const enhancedPrompt = String(data?.enhancedPrompt ?? "").trim();
      if (!enhancedPrompt) throw new Error("Prompt enhancement returned no text.");

      setFinalPrompt(enhancedPrompt);
      setEnhancedPromptDraft(enhancedPrompt);
      setGameRequest(instruction);
      setChatInput("");
      setChatStage("ready");
      studio.setPrompt(enhancedPrompt);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Your detailed game prompt is ready. Review or edit it below, then choose Hybrid, Pro, or Ultra.",
        },
      ]);
    } catch (error: any) {
      showNotice(
        error?.response?.data?.error ??
          error?.message ??
          "Could not enhance the game prompt. Please try again.",
        "error",
      );
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const startTierBuild = (tier: 1 | 2 | 3) => {
    if (!requireLogin()) return;
    const prompt = [finalPrompt || chatPrompt || studio.prompt, chatInput.trim()]
      .filter(Boolean)
      .join(". ");
    if (!prompt.trim()) return;
    void build(tier, prompt);
  };

  const enhancedGameTitle =
    enhancedPromptDraft.match(/^##\s*Title\s*\n\s*\*\*([^*\n]+)\*\*/i)?.[1]?.trim() ?? "";

  return (
    <div className="relative min-h-screen text-white">
      <AppHeader />
      <div className="relative z-10 mx-auto flex max-w-md flex-col px-4 pb-28 pt-2 sm:px-5 sm:pb-6 sm:pt-4">
        {generationNotice && (
          <div
            ref={noticeRef}
            role="alert"
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-black shadow-[0_8px_24px_rgba(8,4,20,0.45)] ${
              generationNoticeKind === "payment"
                ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                : generationNoticeKind === "error"
                  ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                  : "border-fuchsia-400/30 bg-[#160b2e] text-white"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
              {generationNoticeKind === "payment"
                ? "Payment required"
                : generationNoticeKind === "error"
                  ? "Build failed"
                  : "Notice"}
            </p>
            <p className="mt-1 leading-snug">{generationNotice}</p>
            {generationNoticeKind === "payment" && paymentChoice && (
              <div className="mt-3 space-y-2">
                {!isTelegramMiniApp() &&
                  (paymentChoice.billingMode === "subscription" ||
                    paymentChoice.chainMethod === "0g") && (
                    <ZeroGWalletPanel
                      variant="modal"
                      defaultFundAmount={String(
                        paymentChoice.chainAmount ||
                          paymentChoice.subscriptionPrice0G ||
                          "10",
                      )}
                      showHeading={false}
                      className="border-amber-300/20 bg-black/15 p-2.5"
                    />
                  )}
                <div className="grid grid-cols-2 gap-2">
                {paymentChoice.billingMode === "subscription" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void subscribeAndBuild()}
                      disabled={isPaying}
                      className="col-span-2 flex flex-col items-center gap-0.5 rounded-xl border border-fuchsia-300/50 bg-fuchsia-400/20 px-3 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition active:scale-[0.97] disabled:opacity-60"
                    >
                      <span className="font-display text-sm font-black">
                        {paymentChoice.walletRequired
                          ? "Connect wallet & subscribe"
                          : subscriptionFunded
                            ? `Confirm in wallet · ${paymentChoice.subscriptionPrice0G ?? ""} 0G`
                            : `${paymentChoice.subscriptionName ?? "Subscribe"} · ${paymentChoice.subscriptionPrice0G ?? ""} 0G`}
                      </span>
                      <span className="text-[10px] font-bold opacity-75">
                        {paymentChoice.walletRequired
                          ? "Link your wallet, then confirm the subscription"
                          : subscriptionFunded
                            ? "Your balance covers this — approve the transaction"
                            : "30 days of game generation"}
                      </span>
                    </button>
                    {!isTelegramMiniApp() && subscriptionFunded !== true && (
                      <button
                        type="button"
                        onClick={() => void topUpZeroGWallet()}
                        disabled={isFundingWallet || isPaying}
                        className="col-span-2 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-3 py-2 text-xs font-black text-cyan-50 transition active:scale-[0.97] disabled:opacity-60"
                      >
                        {isFundingWallet ? "Opening funding…" : "Top up 0G wallet first"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {paymentChoice.starsAvailable && (
                      <button
                        type="button"
                        onClick={() => void payWithStars()}
                        disabled={isPaying}
                        className="flex flex-col items-center gap-0.5 rounded-xl border border-amber-300/50 bg-amber-400/20 px-3 py-2.5 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition active:scale-[0.97] disabled:opacity-60"
                      >
                        <span className="font-display text-sm font-black">
                          ⭐ {paymentChoice.starsAmount} Stars
                        </span>
                        <span className="text-[10px] font-bold opacity-75">Pay in Telegram</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void payWithChain()}
                      disabled={isPaying}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border border-cyan-300/50 bg-cyan-400/15 px-3 py-2.5 text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition active:scale-[0.97] disabled:opacity-60 ${paymentChoice.starsAvailable ? "" : "col-span-2"}`}
                    >
                      <span className="font-display text-sm font-black">
                        💎 {paymentChoice.chainAmount} {paymentChoice.chainCurrency}
                      </span>
                      <span className="text-[10px] font-bold opacity-75">
                        {paymentChoice.chainMethod === "0g" ? "Pay with 0G wallet" : "Pay with TON wallet"}
                      </span>
                    </button>
                    {paymentChoice.chainMethod === "0g" && !isTelegramMiniApp() && (
                      <button
                        type="button"
                        onClick={() => void topUpZeroGWallet()}
                        disabled={isFundingWallet || isPaying}
                        className={`rounded-xl border border-cyan-300/30 bg-black/20 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-cyan-100 transition active:scale-[0.97] disabled:opacity-60 ${paymentChoice.starsAvailable ? "" : "col-span-2"}`}
                      >
                        {isFundingWallet ? "Opening funding…" : "Top up 0G first"}
                      </button>
                    )}
                  </>
                )}
                </div>
              </div>
            )}
            {generationNoticeKind === "payment" && !paymentChoice && (
              <p className="mt-2 text-xs font-bold opacity-80">
                Your first game is free. Additional generations require payment.
              </p>
            )}
          </div>
        )}

        {templateSeed && (
          <div className="hidden">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10 sm:size-16 sm:rounded-2xl">
              {getThumbnailUrl(templateSeed.id) ? (
                <img
                  src={getThumbnailUrl(templateSeed.id)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full place-items-center text-2xl sm:text-3xl">
                  {templateEmoji[templateSeed.id] ?? "🎮"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-fuchsia-300 sm:text-[10px]">
                Template selected
              </p>
              <h2 className="truncate font-display text-base font-black text-white sm:text-lg">
                {templateSeed.name}
              </h2>
              <p className="line-clamp-1 text-[11px] font-semibold text-violet-300/80 sm:line-clamp-2 sm:text-xs">
                {templateSeed.mechanic}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/templates" })}
              className="self-center rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-black text-white transition hover:bg-white/15 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
            >
              Change
            </button>
          </div>
        )}

        <div className="order-1 mb-4 w-full">
          <div className="relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-[linear-gradient(160deg,rgba(35,4,74,0.98),rgba(13,2,40,0.98))] p-4 shadow-[0_8px_22px_rgba(28,4,64,0.34)]">
            <p className="mb-3 flex items-center gap-2 text-base font-semibold uppercase tracking-[0.02em] text-fuchsia-400">
              <Sparkles className="size-5 shrink-0" />
              {templateSeed ? "Describe your remix" : "What do you want to create?"}
            </p>

            <div
              ref={chatScrollRef}
              className="mb-3 max-h-[min(52vh,420px)] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(217,70,239,0.65)_transparent]"
            >
              <ConsoleChatMessages
                messages={messages}
                chatStage={chatStage}
                isThinking={isThinking}
                onQuickReply={sendChatMessage}
                disabled={phase === "building"}
              />
            </div>

            {chatStage === "ready" && enhancedPromptDraft && (
              <div className="mb-3 rounded-2xl border border-fuchsia-400/40 bg-[#100424] p-3">
                {enhancedGameTitle && (
                  <div className="mb-3 border-b border-violet-400/25 pb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">
                      Game title
                    </p>
                    <h3 className="mt-1 font-display text-xl font-black text-white">
                      {enhancedGameTitle}
                    </h3>
                  </div>
                )}
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-300">
                  {phase === "building" ? "Game prompt being built" : "Editable game prompt"}
                </p>
                <textarea
                  value={enhancedPromptDraft}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEnhancedPromptDraft(value);
                    setFinalPrompt(value);
                    studio.setPrompt(value);
                  }}
                  disabled={phase === "building"}
                  rows={10}
                  className="w-full resize-y rounded-xl border border-violet-400/35 bg-[#090219] px-3 py-3 text-sm font-medium leading-relaxed text-white outline-none transition placeholder:text-violet-300/45 focus:border-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-80"
                  aria-label="Editable enhanced game prompt"
                />
              </div>
            )}

            {canPickBuildTier && (
              <div className="mb-3 grid gap-2.5">
                {phase === "done" || phase === "failed" ? (
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-300">
                    Generate another game
                  </p>
                ) : null}
                {tierButtons.map((t) => (
                  <button
                    key={t.tier}
                    onClick={() => startTierBuild(t.tier)}
                    disabled={
                      phase === "building" ||
                      isPaying ||
                      (!chatInput.trim() && !finalPrompt && !chatPrompt && !studio.prompt)
                    }
                    className={`group relative flex min-h-14 items-center gap-2.5 overflow-hidden rounded-2xl border border-white/65 ${t.gradient} px-3 py-2 text-left shadow-[0_6px_18px_rgba(76,29,149,0.28),inset_0_1px_10px_rgba(255,255,255,0.2)] transition active:scale-[0.99] disabled:opacity-60`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20">
                      <t.icon className={`size-5 ${t.iconColor}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white">{t.label}</span>
                      <span className="block truncate text-[9px] font-medium text-white/90 sm:text-[10px]">
                        {isPaying && buildingTier === t.tier
                          ? "Waiting for payment..."
                          : buildingTier === t.tier
                            ? "Building your game..."
                            : t.subtitle}
                      </span>
                    </span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/35 bg-white/12 text-white">
                      {buildingTier === t.tier ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="size-4" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {isEnhancingPrompt && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/10 px-4 py-3 text-sm font-bold text-fuchsia-100">
                <Loader2 className="size-4 animate-spin" />
                Expanding your idea into a detailed game specification…
              </div>
            )}

            <CreateConsolePanel
              value={chatInput}
              onChange={setChatInput}
              onSubmit={handleCreatePanelSubmit}
              onCategoryPick={sendChatMessage}
              disabled={phase === "building" || isThinking || isEnhancingPrompt}
              placeholder="Describe your game idea..."
              persistExpanded
              modalTheme
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </div>
        </div>

        {phase !== "idle" && (
          <div className="order-3 animate-float-up mb-4 rounded-[1.6rem] border border-white/75 bg-[#120329] p-4 text-white shadow-[0_10px_28px_rgba(28,4,64,0.4)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold uppercase text-white">Build Console</h3>
                <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.12em] text-violet-400">
                  {phase === "done"
                    ? "AI Build Ready"
                    : phase === "failed"
                      ? "Build Failed"
                      : (activeBuild?.statusText ?? studio.agentStatus)}
                  {phase === "building"
                    ? ` · ${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`
                    : ""}
                </p>
              </div>
              {phase === "building" ? (
                <button
                  onClick={cancelBuild}
                  className="shrink-0 rounded-md border border-rose-400/35 px-3 py-1.5 text-[9px] font-medium text-rose-300 transition hover:bg-rose-500/15"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={cancelBuild}
                  className="shrink-0 rounded-md border border-white/25 px-3 py-1.5 text-[9px] font-medium text-violet-200 transition hover:bg-white/10"
                >
                  Dismiss
                </button>
              )}
            </div>
            <div className="relative mt-4 min-h-40">
              <ul className="w-[60%] space-y-3">
                {steps.map((s, i) => {
                  const active = phase === "building" && i === step;
                  const complete = phase === "done" || phase === "failed" || i < step;
                  return (
                    <li key={s} className="relative flex items-center gap-2.5 text-sm font-medium">
                      {i < steps.length - 1 && (
                        <span className="absolute left-[10px] top-5 h-5 border-l border-dashed border-violet-500/45" />
                      )}
                      <span className="flex size-[21px] shrink-0 items-center justify-center rounded-full border border-violet-500/65 bg-[#170436]">
                        {complete ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : active ? (
                          <Loader2 className="size-3.5 animate-spin text-fuchsia-400" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-violet-400/60" />
                        )}
                      </span>
                      <span
                        className={
                          complete || active ? "text-white" : "whitespace-nowrap text-violet-300/65"
                        }
                      >
                        {s}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <img
                src={phase === "done" ? buildIcon : consoleIcon}
                alt=""
                className="pointer-events-none absolute -right-2 top-0 h-full w-[43%] object-contain object-center"
              />
            </div>

            {phase === "failed" && (
              <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {activeBuild?.statusText ?? "The AI build failed."}
                {builtGame?.id && activeBuild?.strategy !== "pure-agent" ? (
                  <span className="mt-1 block text-destructive/80">
                    The playable template version is still in My Creations — run the build again to
                    retry the AI version.
                  </span>
                ) : (
                  <span className="mt-1 block text-destructive/80">
                    Run the build again from this page to retry.
                  </span>
                )}
              </div>
            )}

            {phase === "done" && (
              <div className="mt-4 rounded-[1.25rem] bg-[linear-gradient(135deg,#de42d6,#9749f8)] p-4">
                <p className="text-[10px] font-medium uppercase text-white/85">AI Build Ready</p>
                <h4 className="mt-1 text-2xl font-bold text-white">
                  {builtGame?.title ?? studio.generatedPackage.title} 🎮
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (!builtGameId) return;
                      navigate({ to: "/edit/$gameId", params: { gameId: builtGameId } });
                    }}
                    disabled={!builtGameId}
                    className="flex items-center justify-center gap-2 rounded-full bg-violet-800 px-3 py-2 text-xs font-bold uppercase text-white disabled:opacity-60"
                  >
                    <Wand2 className="size-4" /> Edit Game
                  </button>
                  <button
                    onClick={() => void publishBuiltGame()}
                    disabled={!builtGameId || publishingGame}
                    className="flex items-center justify-center gap-2 rounded-full bg-fuchsia-100 px-3 py-2 text-xs font-bold uppercase text-black disabled:opacity-60"
                  >
                    {publishingGame ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Rocket className="size-4" />
                    )}
                    {publishingGame ? "Publishing…" : "Publish"}
                  </button>
                  <button
                    onClick={() => {
                      if (!builtGameId) return;
                      navigate({ to: "/play", search: { gameId: builtGameId } });
                    }}
                    disabled={!builtGameId}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-full bg-fuchsia-100 px-4 py-2 text-xs font-bold uppercase text-black disabled:opacity-60"
                  >
                    <Play className="size-4" /> Play
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
