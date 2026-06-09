"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button, Card, Form, Input, Label, Text } from "@/components";

import {
  clientStateStorageKey,
  demoLogin,
  getCurrentUser,
  loggedOutClientState,
  preserveAuthClientState,
  stripAuthClientState,
  type ClientDemoState,
} from "./demo-state";
import { JsonCodeBlock } from "./json-code-block";
import styles from "./avatar-menu.module.css";

function persistAuthClientState(state: ClientDemoState) {
  const authOnlyState = preserveAuthClientState(state);

  if (authOnlyState.user) {
    window.localStorage.setItem(
      clientStateStorageKey,
      JSON.stringify(authOnlyState),
    );
  } else {
    window.localStorage.removeItem(clientStateStorageKey);
  }
}

type AvatarMenuProps = {
  clientState: ClientDemoState;
  onClientStateChange: (state: ClientDemoState) => void;
  onResetState: () => void;
  disabled?: boolean;
};

export function AvatarMenu({
  clientState,
  onClientStateChange,
  onResetState,
  disabled = false,
}: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(demoLogin.username);
  const [password, setPassword] = useState(demoLogin.password);
  const [loginError, setLoginError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const currentUser = getCurrentUser(clientState);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      username.trim() !== demoLogin.username ||
      password !== demoLogin.password
    ) {
      setLoginError("Use the demo account.");
      onClientStateChange(loggedOutClientState);
      window.localStorage.removeItem(clientStateStorageKey);
      return;
    }

    setLoginError(null);
    const nextState = { ...clientState, ...demoLogin.state };
    onClientStateChange(nextState);
    persistAuthClientState(nextState);
    setOpen(false);
  }

  function logout() {
    setLoginError(null);
    const nextState = stripAuthClientState(clientState);
    onClientStateChange(nextState);
    persistAuthClientState(nextState);
    setOpen(false);
  }

  function resetState() {
    onResetState();
    setOpen(false);
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        className="min-w-9 px-3"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Settings"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">⚙</span>
      </Button>

      {open ? (
        <Card className={styles.menu} role="menu">
          {currentUser ? (
            <div className={styles.userSummary}>
              <Text as="strong" className="font-semibold">
                {currentUser.name}
              </Text>
              <Text as="span" className="text-sm text-text-muted">
                {currentUser.email}
              </Text>
            </div>
          ) : null}

          <div className={styles.stateSection}>
            <Text
              as="span"
              className="text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              State
            </Text>
            <JsonCodeBlock value={clientState} className={styles.stateBlock} />
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" className="w-full" onClick={resetState}>
              Reset state
            </Button>
            {currentUser ? (
              <Button type="button" variant="ghost" className="w-full" onClick={logout}>
                Log out
              </Button>
            ) : null}
          </div>

          {!currentUser ? (
            <Form className={styles.loginForm} onSubmit={submitLogin}>
              <Label htmlFor="shell-username">Username</Label>
              <Input
                id="shell-username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />

              <Label htmlFor="shell-password">Password</Label>
              <Input
                id="shell-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <Button type="submit" className="w-full">
                Log in
              </Button>
              {loginError ? (
                <p className="m-0 text-sm text-danger" role="alert">
                  {loginError}
                </p>
              ) : null}
            </Form>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
