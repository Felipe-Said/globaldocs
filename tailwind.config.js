/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				DEFAULT: '#0075DE',
  				link: '#097FE8',
  				pressed: '#005BAB',
  				tint: '#E6F3FE'
  			},
  			ink: {
  				DEFAULT: '#000000',
  				muted: '#615D59',
  				faint: '#A39E98'
  			},
  			surface: {
  				DEFAULT: '#FFFFFF',
  				warm: '#F6F5F4',
  				card: '#F9F9F8'
  			},
  			hairline: '#DFDCD9',
  			borderSoft: '#0000001A',
  			accent: {
  				amber: '#FFB110',
  				'amber-deep': '#E89D01',
  				coral: '#F64932',
  				red: '#E32D14',
  				indigo: '#1313BA',
  				lavender: '#EADBFA'
  			},
  			success: {
  				DEFAULT: '#1AAE39',
  				tint: '#D0F4D8'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica',
  				'Arial',
  				'sans-serif'
  			],
  			serif: [
  				'Georgia',
  				'Lyon Text',
  				'serif'
  			]
  		},
  		borderRadius: {
  			xs: '4px',
  			sm: '8px',
  			md: '12px',
  			full: '9999px'
  		},
  		boxShadow: {
  			'notion-hairline': '0px 1px 0px 0px rgba(0, 0, 0, 0.08)',
  			'notion-card': '0px 1px 2px rgba(0, 0, 0, 0.04), 0px 4px 12px rgba(0, 0, 0, 0.03)',
  			'notion-hover': '0px 2px 4px rgba(0, 0, 0, 0.06), 0px 8px 24px rgba(0, 0, 0, 0.06)',
  			'notion-modal': '0px 16px 40px rgba(0, 0, 0, 0.12), 0px 4px 12px rgba(0, 0, 0, 0.05)'
  		}
  	}
  },
  plugins: [],
}
