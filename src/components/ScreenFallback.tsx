import { Screen } from "./ui";

/** Empty screen shown while route params resolve, so navigations stay instant. */
export function ScreenFallback() {
  return <Screen>{null}</Screen>;
}
