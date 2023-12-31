'use client'

import { useEffect, useRef } from "react";
import { Engine, EngineOptions, Scene, SceneOptions } from "@babylonjs/core";
import { GameEngine } from "./gameEngine";

type SceneComponentProps = {
  gameEngine: GameEngine,
  id: string,
}

export default function BabylonJSCanvas({ gameEngine, id, ...rest }: SceneComponentProps) {
  const reactCanvas = useRef(null);

  // set up basic engine and scene
  useEffect(() => {
    const { current: canvas } = reactCanvas;

    if (!canvas) return;

    gameEngine.start(canvas);

    if (window) {
      window.addEventListener("resize", () => gameEngine.resize());
    }

    return () => {
      gameEngine.babylonEngine?.dispose();

      if (window) {
        window.removeEventListener("resize", () => gameEngine.resize());
      }
    };
  }, [gameEngine]);

  return <canvas ref={reactCanvas} id={id} {...rest} />;
};