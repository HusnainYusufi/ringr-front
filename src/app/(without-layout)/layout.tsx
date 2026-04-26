import { type PropsWithChildren } from "react";

export default function WithoutLayout({ children }: PropsWithChildren) {
  return <div>WithoutLayout {children}</div>;
}
