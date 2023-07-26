'use client'

import { useEffect, useRef } from "react";
import { Engine, EngineOptions, Scene, SceneOptions } from "@babylonjs/core";
import { GameEngine } from "./engine/engine";

type SceneComponentProps = {
  gameEngine: GameEngine,
  id: string,
}

export default function GameCanvas({ gameEngine, id, ...rest }: SceneComponentProps) {
  const reactCanvas = useRef(null);

  // set up basic engine and scene
  useEffect(() => {
    const { current: canvas } = reactCanvas;

    if (!canvas) return;

    const engine = new Engine(canvas, gameEngine.antialias, gameEngine.engineOptions, gameEngine.adaptToDeviceRatio);
    const scene = new Scene(engine, gameEngine.sceneOptions);

    if (scene.isReady()) {
      gameEngine.start(scene);
    } else {
      scene.onReadyObservable.addOnce((scene) => gameEngine.start(scene));
    }

    engine.runRenderLoop(() => {
      gameEngine.update(scene);
      scene.render();
    });

    const resize = () => {
      scene.getEngine().resize();
    };

    if (window) {
      window.addEventListener("resize", resize);
    }

    return () => {
      scene.getEngine().dispose();

      if (window) {
        window.removeEventListener("resize", resize);
      }
    };
  }, [gameEngine]);

  return <canvas ref={reactCanvas} id={id} {...rest} />;
};