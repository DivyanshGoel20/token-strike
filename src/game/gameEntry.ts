// Standalone game entry point - runs in a separate window
import Phaser from 'phaser'
import { PreloadAssets } from './scenes/preloadAssets'
import { PlayGame } from './scenes/playGame'
import { GameOptions } from './gameOptions'

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('game-container')
	if (!container) {
		console.error('Game container not found')
		return
	}

	// object to initialize the Scale Manager
	const scaleObject: Phaser.Types.Core.ScaleConfig = {
		mode: Phaser.Scale.FIT, // adjust size to automatically fit in the window
		autoCenter: Phaser.Scale.CENTER_BOTH, // center the game horizontally and vertically
		parent: container, // DOM element where to render the game
		width: GameOptions.gameSize.width, // game width, in pixels
		height: GameOptions.gameSize.height, // game height, in pixels
	}

	// game configuration object
	const configObject: Phaser.Types.Core.GameConfig = {
		type: Phaser.WEBGL, // game renderer
		backgroundColor: GameOptions.gameBackgroundColor, // game background color
		scale: scaleObject, // scale settings
		scene: [
			// array with game scenes
			PreloadAssets, // PreloadAssets scene
			PlayGame, // PlayGame scene
		],
		physics: {
			default: 'arcade', // physics engine used is arcade physics
		},
	}

	// the game itself
	const game = new Phaser.Game(configObject)

	// Listen for game over event and close window
	window.addEventListener('gameOver', () => {
		// Small delay before closing to show game over state
		setTimeout(() => {
			window.close()
		}, 2000)
	})

	// Handle window close
	window.addEventListener('beforeunload', () => {
		if (game) {
			try {
				game.destroy(true)
			} catch (e) {
				console.warn('Error destroying game on window close:', e)
			}
		}
	})
})

