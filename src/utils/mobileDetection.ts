// Utility to detect if user is on a mobile device
export function isMobileDevice(): boolean {
	if (typeof window === 'undefined') return false
	
	// Check user agent
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
	
	// Mobile device patterns
	const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
	const isMobileUA = mobileRegex.test(userAgent)
	
	// Check screen width (additional check)
	const isMobileScreen = window.innerWidth <= 768
	
	// Check for touch support
	const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
	
	return isMobileUA || (isMobileScreen && hasTouchScreen)
}

// Check if device is iOS
export function isIOS(): boolean {
	if (typeof window === 'undefined') return false
	return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Check if device is Android
export function isAndroid(): boolean {
	if (typeof window === 'undefined') return false
	return /Android/.test(navigator.userAgent)
}

