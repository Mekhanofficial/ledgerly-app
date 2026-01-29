// constants/Layout.ts
import { Dimensions } from 'react-native';

export const Layout = {
  window: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
};