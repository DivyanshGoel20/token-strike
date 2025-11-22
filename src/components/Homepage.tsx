import { ConnectButton } from '@rainbow-me/rainbowkit'
import './Homepage.css'

export function Homepage() {
	const handleStartGame = () => {
		// Placeholder - will be implemented later
		console.log('Start game clicked')
	}

	return (
		<div className="homepage">
			<div className="homepage-container">
				<h1 className="homepage-title">Game Title</h1>
				<div className="homepage-buttons">
					<ConnectButton />
					<button className="start-game-button" onClick={handleStartGame}>
						Start Game
					</button>
				</div>
			</div>
		</div>
	)
}

