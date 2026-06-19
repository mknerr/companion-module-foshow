import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

export default [
	{
		ignores: ['pkg/**', 'dist/**', '.yarn/**'],
	},
	...(await generateEslintConfig({})),
]
