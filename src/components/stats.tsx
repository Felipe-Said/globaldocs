import { cn } from "@/lib/utils";
import type React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { useStore } from "@/context/StoreContext";

type Stat = {
	label: string;
	value: string;
	delta: number;
};

export function DashboardStats() {
	const { orders, products, collections } = useStore();

	const totalRevenue = orders
		.filter((o) => o.status === "paid")
		.reduce((sum, o) => sum + o.total, 0);

	const paidOrdersCount = orders.filter((o) => o.status === "paid").length;
	const activeProductsCount = products.filter((p) => p.active).length;

	const dynamicStats: Stat[] = [
		{
			label: "Faturamento Real",
			value: totalRevenue.toLocaleString("pt-BR", {
				style: "currency",
				currency: "BRL",
			}),
			delta: 14.8,
		},
		{
			label: "Vendas Confirmadas",
			value: `${paidOrdersCount} pedidos`,
			delta: 8.2,
		},
		{
			label: "Itens & Coleções Ativas",
			value: `${activeProductsCount} itens (${collections.length} coleções)`,
			delta: 3.5,
		},
	];

	return (
		<>
			{dynamicStats.map((s) => (
				<StatCard key={s.label} stat={s} />
			))}
		</>
	);
}

function StatCard({
	stat,
	className,
	...props
}: React.ComponentProps<typeof Card> & { stat: Stat }) {
	const { label, value, delta } = stat;
	return (
		<Card
			className={cn("rounded-none bg-background shadow-none ring-0", className)}
			{...props}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="font-normal text-muted-foreground text-xs tracking-wide">
					{label}
				</CardTitle>
				<CardDescription className="flex items-center gap-1 text-xs tabular-nums">
					<Delta value={delta}>
						<DeltaIcon />
						<DeltaValue />
					</Delta>
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-row items-center gap-2">
				<p className="font-medium text-xl tabular-nums">{value}</p>
			</CardContent>
		</Card>
	);
}
