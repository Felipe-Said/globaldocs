import { LayoutGridIcon, BarChart3Icon, BriefcaseIcon, UsersIcon, PlugIcon, KeyRoundIcon, SettingsIcon, SendIcon, HelpCircleIcon, BookOpenIcon } from "lucide-react";

export type SidebarNavItem = {
	title: string;
	url: string;
	icon: React.ReactNode;
	isActive?: boolean;
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Product",
		items: [
			{
				title: "Dashboard",
				url: "#/overview",
				icon: (
					<LayoutGridIcon
					/>
				),
				isActive: true,
			},
			{
				title: "Analytics",
				url: "#/analytics",
				icon: (
					<BarChart3Icon
					/>
				),
			},
			{
				title: "Projects",
				url: "#/projects",
				icon: (
					<BriefcaseIcon
					/>
				),
			},
			{
				title: "Team",
				url: "#/team",
				icon: (
					<UsersIcon
					/>
				),
			},
			{
				title: "Integrations",
				url: "#/integrations",
				icon: (
					<PlugIcon
					/>
				),
			},
			{
				title: "API Keys",
				url: "#/api-keys",
				icon: (
					<KeyRoundIcon
					/>
				),
			},
		],
	},
	{
		label: "Administration",
		items: [
			{
				title: "Settings",
				url: "#/settings",
				icon: (
					<SettingsIcon
					/>
				),
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Feedback",
		url: "#/feedback",
		icon: (
			<SendIcon data-icon="inline-start" />
		),
	},
	{
		title: "Help Center",
		url: "#/help",
		icon: (
			<HelpCircleIcon
			/>
		),
	},

	{
		title: "Documentation",
		url: "#/documentation",
		icon: (
			<BookOpenIcon
			/>
		),
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) => group.items),
	...footerNavLinks,
];
