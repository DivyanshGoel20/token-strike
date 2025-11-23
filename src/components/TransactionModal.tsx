import { useState, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, maxUint256 } from 'viem'
import { GAME_BANK_ADDRESS, GAME_BANK_ABI, TOKENS, TOKEN_INFO, ERC20_ABI } from '../config/contract'
import { fetchPythPriceUpdateForToken } from '../services/pyth'
import './TransactionModal.css'

interface TransactionModalProps {
	isOpen: boolean
	onClose: () => void
	mode: 'deposit' | 'withdraw'
}

export function TransactionModal({ isOpen, onClose, mode }: TransactionModalProps) {
	const { address } = useAccount()
	const [selectedToken, setSelectedToken] = useState<keyof typeof TOKENS>('WLD')
	const [amount, setAmount] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const tokenAddress = TOKENS[selectedToken]
	const tokenInfo = TOKEN_INFO[tokenAddress]

	// Get user's token balance
	const { data: tokenBalance, refetch: refetchBalance } = useBalance({
		address,
		token: tokenAddress as `0x${string}`,
		query: {
			enabled: !!address && isOpen,
		},
	})

	// Get user's deposited balance in contract
	const { data: depositedBalances } = useReadContract({
		address: GAME_BANK_ADDRESS,
		abi: GAME_BANK_ABI,
		functionName: 'getBalances',
		args: address ? [address] : undefined,
		query: {
			enabled: !!address && isOpen,
		},
	})

	const { writeContract, data: hash, isPending } = useWriteContract()
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	})

	// Get allowance
	const { data: allowance } = useReadContract({
		address: tokenAddress as `0x${string}`,
		abi: ERC20_ABI,
		functionName: 'allowance',
		args: address && tokenAddress ? [address, GAME_BANK_ADDRESS] : undefined,
		query: {
			enabled: !!address && isOpen && mode === 'deposit',
		},
	})

	const { writeContract: writeApprove } = useWriteContract()

	useEffect(() => {
		if (isSuccess) {
			setIsLoading(false)
			setAmount('')
			setError(null)
			refetchBalance()
			setTimeout(() => {
				onClose()
			}, 2000)
		}
	}, [isSuccess, onClose, refetchBalance])

	if (!isOpen) return null

	const handleMax = () => {
		if (!tokenBalance) return
		
		if (mode === 'deposit') {
			setAmount(formatUnits(tokenBalance.value, tokenBalance.decimals))
		} else {
			// For withdraw, use deposited balance
			if (depositedBalances) {
				const [wbtc, weth, wld] = depositedBalances as [bigint, bigint, bigint]
				const balance = selectedToken === 'WBTC' ? wbtc : selectedToken === 'WETH' ? weth : wld
				setAmount(formatUnits(balance, tokenInfo.decimals))
			}
		}
	}

	const handleSubmit = async () => {
		console.log('=== handleSubmit called ===')
		console.log('Address:', address)
		console.log('Amount:', amount)
		console.log('Mode:', mode)
		console.log('Selected token:', selectedToken)
		
		if (!address || !amount || parseFloat(amount) <= 0) {
			console.log('Validation failed - missing address or invalid amount')
			setError('Please enter a valid amount')
			return
		}

		setError(null)
		setIsLoading(true)

		try {
			console.log('=== Converting amount to wei ===')
			console.log('Amount string:', amount)
			console.log('Token decimals:', tokenInfo.decimals)
			const amountWei = parseUnits(amount, tokenInfo.decimals)
			console.log('Amount (wei):', amountWei.toString())

			// Check balance
			if (mode === 'deposit') {
				console.log('=== Deposit mode - checking balance ===')
				console.log('Token balance:', tokenBalance?.value?.toString())
				console.log('Amount wei:', amountWei.toString())
				
				if (!tokenBalance || tokenBalance.value < amountWei) {
					console.log('Insufficient balance')
					setError('Insufficient balance')
					setIsLoading(false)
					return
				}

				// Check and handle approval
				console.log('=== Checking allowance ===')
				console.log('Current allowance:', allowance?.toString())
				console.log('Required amount:', amountWei.toString())
				
				if (!allowance || allowance < amountWei) {
					console.log('=== Approval needed - requesting approval ===')
					console.log('Token address:', tokenAddress)
					console.log('Spender (contract):', GAME_BANK_ADDRESS)
					console.log('Amount (maxUint256):', maxUint256.toString())
					
					// Need to approve first
					writeApprove({
						address: tokenAddress as `0x${string}`,
						abi: ERC20_ABI,
						functionName: 'approve',
						args: [GAME_BANK_ADDRESS, maxUint256],
					}, {
						onSuccess: async (hash) => {
							console.log('=== Approval transaction sent ===')
							console.log('Approval transaction hash:', hash)
							console.log('Waiting 3 seconds for approval to be mined...')
							// Wait a bit for approval to be mined, then proceed with deposit
							await new Promise(resolve => setTimeout(resolve, 3000))
							console.log('Proceeding with deposit after approval...')
							await executeDeposit(amountWei)
						},
						onError: (err) => {
							console.error('=== Approval error ===')
							console.error('Error:', err)
							setError(err.message)
							setIsLoading(false)
						},
					})
					return
				} else {
					console.log('=== Sufficient allowance - proceeding directly ===')
				}
			} else {
				// Withdraw mode - check deposited balance
				console.log('=== Withdraw mode - checking deposited balance ===')
				if (depositedBalances) {
					const [wbtc, weth, wld] = depositedBalances as [bigint, bigint, bigint]
					const deposited = selectedToken === 'WBTC' ? wbtc : selectedToken === 'WETH' ? weth : wld
					console.log('Deposited balance:', deposited.toString())
					console.log('Requested amount:', amountWei.toString())
					
					if (deposited < amountWei) {
						console.log('Insufficient deposited balance')
						setError('Insufficient deposited balance')
						setIsLoading(false)
						return
					}
				}
			}

			console.log('=== Executing transaction ===')
			await executeTransaction(amountWei)
		} catch (err: any) {
			console.error('=== handleSubmit error ===')
			console.error('Error:', err)
			setError(err.message || 'Transaction failed')
			setIsLoading(false)
		}
	}

	const executeDeposit = async (amountWei: bigint) => {
		try {
			console.log('Executing deposit after approval...')
			await executeTransaction(amountWei)
		} catch (err: any) {
			console.error('Deposit execution error:', err)
			setError(err.message || 'Failed to execute deposit')
			setIsLoading(false)
		}
	}

	const executeTransaction = async (amountWei: bigint) => {
		try {
			console.log('=== Starting Transaction Execution ===')
			console.log('Mode:', mode)
			console.log('Selected token:', selectedToken)
			console.log('Token address:', tokenAddress)
			console.log('Amount entered:', amount)
			console.log('Amount (wei):', amountWei.toString())
			console.log('Token decimals:', tokenInfo.decimals)
			
			// Fetch Pyth price update for the selected token only
			console.log('=== Fetching Pyth Price Update ===')
			console.log('Fetching price update for token:', selectedToken)
			const priceUpdateHex = await fetchPythPriceUpdateForToken(selectedToken)
			console.log('Received price update hex (first 100 chars):', priceUpdateHex.substring(0, 100) + '...')
			console.log('Price update hex full length:', priceUpdateHex.length)
			
			// Convert to bytes array format (array with single element)
			const priceUpdateBytes: `0x${string}`[] = [priceUpdateHex as `0x${string}`]
			console.log('Price update bytes array length:', priceUpdateBytes.length)
			console.log('Price update bytes[0] (first 100 chars):', priceUpdateBytes[0].substring(0, 100) + '...')

			console.log('=== Contract Call Parameters ===')
			console.log('Contract address:', GAME_BANK_ADDRESS)
			console.log('Function name:', mode === 'deposit' ? 'deposit' : 'withdraw')
			console.log('Args:')
			console.log('  - token:', tokenAddress)
			console.log('  - amount (wei):', amountWei.toString())
			console.log('  - priceUpdate (bytes[]):', priceUpdateBytes.length, 'element(s)')

			// Estimate Pyth fee - send a small amount of ETH (0.001 ETH should be enough)
			// The contract will refund any excess
			const pythFeeEstimate = parseUnits('0.001', 18) // 0.001 ETH
			console.log('Pyth fee estimate (wei):', pythFeeEstimate.toString())
			console.log('Sending transaction with value:', pythFeeEstimate.toString(), 'wei')

			if (mode === 'deposit') {
				console.log('=== Calling deposit() function ===')
				writeContract({
					address: GAME_BANK_ADDRESS,
					abi: GAME_BANK_ABI,
					functionName: 'deposit',
					args: [tokenAddress, amountWei, priceUpdateBytes],
					value: pythFeeEstimate, // Send ETH for Pyth update fee
				}, {
					onSuccess: (hash) => {
						console.log('=== Deposit Transaction Success ===')
						console.log('Transaction hash:', hash)
						console.log('Waiting for confirmation...')
					},
					onError: (err) => {
						console.error('=== Deposit Transaction Error ===')
						console.error('Error details:', err)
						console.error('Error message:', err.message)
						setError(err.message)
						setIsLoading(false)
					},
				})
			} else {
				console.log('=== Calling withdraw() function ===')
				writeContract({
					address: GAME_BANK_ADDRESS,
					abi: GAME_BANK_ABI,
					functionName: 'withdraw',
					args: [tokenAddress, amountWei, priceUpdateBytes],
					value: pythFeeEstimate, // Send ETH for Pyth update fee
				}, {
					onSuccess: (hash) => {
						console.log('=== Withdraw Transaction Success ===')
						console.log('Transaction hash:', hash)
						console.log('Waiting for confirmation...')
					},
					onError: (err) => {
						console.error('=== Withdraw Transaction Error ===')
						console.error('Error details:', err)
						console.error('Error message:', err.message)
						setError(err.message)
						setIsLoading(false)
					},
				})
			}
		} catch (err: any) {
			console.error('=== Transaction Execution Error ===')
			console.error('Error type:', err?.constructor?.name)
			console.error('Error message:', err?.message)
			console.error('Error stack:', err?.stack)
			setError(err.message || 'Failed to fetch price updates')
			setIsLoading(false)
		}
	}

	const availableBalance = mode === 'deposit' 
		? tokenBalance ? formatUnits(tokenBalance.value, tokenBalance.decimals) : '0'
		: depositedBalances 
			? (() => {
				const [wbtc, weth, wld] = depositedBalances as [bigint, bigint, bigint]
				const balance = selectedToken === 'WBTC' ? wbtc : selectedToken === 'WETH' ? weth : wld
				return formatUnits(balance, tokenInfo.decimals)
			})()
			: '0'

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>{mode === 'deposit' ? 'Deposit' : 'Withdraw'} {tokenInfo.symbol}</h2>
					<button className="modal-close" onClick={onClose}>×</button>
				</div>

				<div className="modal-body">
					<div className="token-selector">
						<label>Select Token:</label>
						<select 
							value={selectedToken} 
							onChange={(e) => setSelectedToken(e.target.value as keyof typeof TOKENS)}
							disabled={isLoading}
						>
							<option value="WBTC">WBTC</option>
							<option value="WETH">WETH</option>
							<option value="WLD">WLD</option>
						</select>
					</div>

					<div className="amount-input">
						<label>Amount:</label>
						<div className="input-group">
							<input
								type="number"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0.0"
								disabled={isLoading}
								step="any"
								min="0"
							/>
							<button 
								className="max-button" 
								onClick={handleMax}
								disabled={isLoading}
							>
								MAX
							</button>
						</div>
						<div className="balance-info">
							Available: {parseFloat(availableBalance).toFixed(6)} {tokenInfo.symbol}
						</div>
					</div>

					{error && <div className="error-message">{error}</div>}

					{isSuccess && (
						<div className="success-message">
							Transaction successful!
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button 
						className="modal-button cancel-button" 
						onClick={onClose}
						disabled={isLoading || isPending || isConfirming}
					>
						Cancel
					</button>
					<button 
						className="modal-button submit-button" 
						onClick={handleSubmit}
						disabled={isLoading || isPending || isConfirming || !amount || parseFloat(amount) <= 0}
					>
						{isLoading || isPending || isConfirming 
							? 'Processing...' 
							: mode === 'deposit' ? 'Deposit' : 'Withdraw'
						}
					</button>
				</div>
			</div>
		</div>
	)
}

