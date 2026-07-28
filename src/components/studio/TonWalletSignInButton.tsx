import type { ComponentProps } from "react";

import { StudioSignInButton } from "./StudioSignInButton";

type TonWalletSignInButtonProps = Omit<ComponentProps<typeof StudioSignInButton>, "variant">;

/** Header nav sign-in — same flow as profile/sidebar (Google, email, wallet). */
export function TonWalletSignInButton(props: TonWalletSignInButtonProps) {
  return <StudioSignInButton variant="header" {...props} />;
}

export { TonWalletSignInButton as TelegramSignInButton };
