import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#7a4a2c",
    background: "#fdfaf6",
    surface: "#ffffff",
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#d9a679",
    background: "#211a15",
    surface: "#2b241e",
  },
};
