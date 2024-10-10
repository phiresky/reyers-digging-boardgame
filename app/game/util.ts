import { useState, useLayoutEffect, useEffect } from "react";
import { cryptoRandomId, getSHA256Hash } from "~/util";

export function useLocalStorage<T>(
  id: string,
  init: () => T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState(null);

  // synchronize initially
  useLayoutEffect(() => {
    const newValue = window.localStorage.getItem(id);
    if (newValue !== null) {
      setValue(JSON.parse(newValue));
    }
  }, [id]);

  // synchronize on change
  useEffect(() => {
    if (value !== null) window.localStorage.setItem(id, JSON.stringify(value));
  }, [id, value]);
  return [value ?? init(), setValue as React.Dispatch<React.SetStateAction<T>>];
}

export function usePlayerSessionSecret() {
  const [sessionSecret] = useLocalStorage("playerSessionSecret", () =>
    cryptoRandomId(10)
  )[0];
  const [sessionSecretHash, setSessionSecretHash] = useState("");
  useEffect(() => {
    getSHA256Hash(sessionSecret).then(setSessionSecretHash);
  }, [sessionSecret]);

  return [sessionSecret, sessionSecretHash];
}
