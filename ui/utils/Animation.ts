import { Easing, FadeInUp, FadeOut } from "react-native-reanimated";

const SPRING_CONFIG = { mass: 1, damping: 20, stiffness: 300 };

type AnimationStyle = "default" | "spring" | "list" | "fade";

const PapillonSpring = (a: any) =>
  a?.springify().mass(SPRING_CONFIG.mass).damping(SPRING_CONFIG.damping).stiffness(SPRING_CONFIG.stiffness);

const PapillonList = (a: any) =>
  a?.duration(300).easing(Easing.out(Easing.exp));

const PapillonFade = {
  in: FadeInUp.duration(200).easing(Easing.out(Easing.ease)).withInitialValues({
    opacity: 0,
    transform: [{ translateY: 6 }],
  }),
  out: FadeOut.duration(150).easing(Easing.in(Easing.ease)),
};

export const Animation = (animation?: any, style?: AnimationStyle) => {
  switch (style) {
  case "spring":
    return PapillonSpring(animation);
  case "list":
    return PapillonList(animation);
  default:
    return PapillonSpring(animation);
  }
};

export const PapillonFadeIn = PapillonFade.in;
export const PapillonFadeOut = PapillonFade.out;
