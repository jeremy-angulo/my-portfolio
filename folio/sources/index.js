import './threejs-override.js'
import { applyDom } from './Game/I18n.js'
import { Game } from './Game/Game.js'
import consoleLog from './data/consoleLog.js'

if(import.meta.env.VITE_LOG)
    console.log(
        ...consoleLog
    )

// Traductions du DOM avant que le jeu ne capture ses références d'éléments
applyDom()

if(import.meta.env.VITE_GAME_PUBLIC)
    window.game = new Game()
else
    new Game()
