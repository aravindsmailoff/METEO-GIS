export * from 'react-native-web';

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => ({}),
};

export function codegenNativeCommands() {
  return {};
}

export function codegenNativeComponent(name: string) {
  return name;
}

export default codegenNativeComponent;
