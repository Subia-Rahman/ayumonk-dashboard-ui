import { useEffect, useState } from "react";

const STANDALONE_QUERY = "(display-mode: standalone)";
const NARROW_QUERY = "(max-width: 820px)";
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

// True when the app should render its mobile surface:
//   1. installed PWA (display-mode: standalone, or iOS Safari standalone flag)
//   2. narrow viewport (≤ 820px)
//   3. mobile-class user agent
//
// Any one of these flips the shell. Desktop browsers resized narrow still flip
// to mobile by design — this matches "render whichever surface fits the device".
function detect() {
  if (typeof window === "undefined") return false;

  const standalone =
    (typeof window.matchMedia === "function" &&
      window.matchMedia(STANDALONE_QUERY).matches) ||
    window.navigator?.standalone === true;

  const narrow =
    typeof window.matchMedia === "function" &&
    window.matchMedia(NARROW_QUERY).matches;

  const ua = window.navigator?.userAgent || "";
  const mobileUA = MOBILE_UA.test(ua);

  return Boolean(standalone || narrow || mobileUA);
}

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(detect);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const queries = [
      window.matchMedia(STANDALONE_QUERY),
      window.matchMedia(NARROW_QUERY),
    ];
    const update = () => setIsMobile(detect());
    queries.forEach((mq) => {
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", update);
      } else if (typeof mq.addListener === "function") {
        mq.addListener(update);
      }
    });
    window.addEventListener("resize", update);

    return () => {
      queries.forEach((mq) => {
        if (typeof mq.removeEventListener === "function") {
          mq.removeEventListener("change", update);
        } else if (typeof mq.removeListener === "function") {
          mq.removeListener(update);
        }
      });
      window.removeEventListener("resize", update);
    };
  }, []);

  return isMobile;
}
