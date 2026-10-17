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
import { supabase } from "@/lib/supabase";
import { AlertCircle, RefreshCw, WalletCards } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
			<IntegrationBalanceCard />
		</>
	);
}

type IntegrationBalance = {
	currency: string;
	total: number;
	fetchedAt: string;
};

function IntegrationBalanceCard() {
	const [balance, setBalance] = useState<IntegrationBalance | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	const refreshBalance = useCallback(async () => {
		setLoading(true);
		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) throw new Error("Sessão administrativa expirada.");
			const response = await fetch("/api/nppr", {
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Saldo indisponível.");
			setBalance(result.balance || null);
			setError(result.balanceError || (!result.balance ? "Saldo indisponível." : ""));
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Saldo indisponível.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshBalance();
		const interval = window.setInterval(() => void refreshBalance(), 30_000);
		return () => window.clearInterval(interval);
	}, [refreshBalance]);

	return (
		<Card className={`rounded-none bg-background shadow-none ring-0 ${error ? "border-rose-200" : balance?.total === 0 ? "border-amber-200" : ""}`}>
			<CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
				<div>
					<CardTitle className="font-normal text-muted-foreground text-xs tracking-wide">
						Saldo da Integração
					</CardTitle>
					<CardDescription className="mt-1 text-[10px]">Consulta privada em tempo real</CardDescription>
				</div>
				<button
					type="button"
					onClick={() => void refreshBalance()}
					disabled={loading}
					aria-label="Atualizar saldo da integração"
					className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-muted/45 text-muted-foreground transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60"
				>
					<RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
				</button>
			</CardHeader>
			<CardContent aria-live="polite">
				{error ? (
					<div className="flex items-start gap-2 text-xs leading-relaxed text-rose-700">
						<AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						<span>{error}</span>
					</div>
				) : (
					<>
						<p className="font-medium text-xl tabular-nums">
							{loading && !balance ? "—" : `${Number(balance?.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balance?.currency || "USD"}`}
						</p>
						<p className={`mt-1 flex items-center gap-1 text-[10px] ${balance?.total === 0 ? "text-amber-700" : "text-muted-foreground"}`}>
							<WalletCards className="size-3.5" aria-hidden="true" />
							{balance?.fetchedAt ? `Atualizado às ${new Date(balance.fetchedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Atualizando..."}
						</p>
					</>
				)}
			</CardContent>
		</Card>
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
