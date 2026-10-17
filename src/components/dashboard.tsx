import { DashboardInvoices } from "@/components/dashboard-invoices";
import { DashboardStats } from "@/components/stats";
import { useStore } from "@/context/StoreContext";

export function Dashboard() {
	const { settings } = useStore();

	return (
		<div className="flex flex-1 flex-col gap-6 py-2">
			<div className="flex flex-col gap-1">
				<h1 className="font-semibold text-2xl tracking-tight leading-tight text-foreground">
					Painel de Controle — {settings.storeName}
				</h1>
				<p className="text-sm text-muted-foreground">
					Métricas em tempo real de faturamento, pedidos aprovados e desempenho da loja.
				</p>
			</div>
			<div className="rounded-lg overflow-hidden border bg-background shadow-xs">
				<div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
					<DashboardStats />
					<DashboardInvoices />
				</div>
			</div>
		</div>
	);
}
