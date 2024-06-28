import { WebAuthnKey } from "@zerodev/passkey-validator/_types/toWebAuthnKey";
import React from "react";

interface iAppcontext {
  validatorInstance: WebAuthnKey | undefined;
  setValidatorInstance: (validator: WebAuthnKey) => void;
}

export const AppContextCreator = React.createContext<iAppcontext | undefined>(
  undefined
);

export function AppContextProvider({ children }:any) {
  const [validatorInstance, setValidatorInstance] = React.useState<
    WebAuthnKey | undefined
  >(undefined);

  const values = {
    validatorInstance,
    setValidatorInstance,
  };




//   return <AppContextCreator.Provider value={values}> {children} </AppContextCreator.Provider>
  return <AppContextCreator.Provider value={values}> {children}</AppContextCreator.Provider>;
}
