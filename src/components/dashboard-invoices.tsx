"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useStore } from "@/context/StoreContext";
import { ArrowRight, ShoppingBag } from "lucide-react";

export function DashboardInvoices({ onNavigateOrders }: { onNavigateOrders?: () => void }) {
	const { orders } = useStore();

	return (
		<Card className="min-w-0 overflow-hidden rounded-xl border-black/10 bg-white shadow-xs">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="text-base">Vendas & pedidos recentes</CardTitle>
					<CardDescription>Últimas transações registradas na plataforma.</CardDescription>
				</div>
				<button type="button" onClick={onNavigateOrders} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/5">
					Ver todos <ArrowRight className="size-4" aria-hidden={true} />
				</button>
			</CardHeader>
			<CardContent className="px-0 pb-2">
				{orders.length === 0 ? (
					<div className="flex min-h-48 flex-col items-center justify-center border-t px-6 text-center">
						<span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground"><ShoppingBag className="size-5" aria-hidden={true} /></span>
						<p className="text-sm font-medium text-foreground">Nenhum pedido registrado</p>
						<p className="mt-1 text-xs text-muted-foreground">As próximas vendas aparecerão aqui automaticamente.</p>
					</div>
				) : <Table className="border-t">
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-[120px] pl-6">Pedido</TableHead>
							<TableHead>Cliente</TableHead>
							<TableHead>Itens / Formato</TableHead>
							<TableHead>Pagamento</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="pr-6 text-right">Valor</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orders.slice(0, 6).map((order) => {
							const isPaid = order.status === "paid";

							return (
								<TableRow key={order.id}>
									<TableCell className="font-semibold text-xs pl-6">
										{order.id}
									</TableCell>
									<TableCell>
										<div className="font-medium text-xs text-foreground">
											{order.customerName}
										</div>
										<div className="text-[11px] text-muted-foreground">
											{order.customerEmail}
										</div>
									</TableCell>
									<TableCell>
										<div className="text-xs text-foreground truncate max-w-[220px]">
											{order.items.map((i) => i.productTitle).join(", ")}
										</div>
										<div className="text-[10px] text-muted-foreground">
											{order.items.length} item(ns)
										</div>
									</TableCell>
									<TableCell className="text-xs uppercase text-muted-foreground font-mono">
										{order.paymentMethod}
									</TableCell>
									<TableCell>
										<div className="flex flex-col items-start gap-1">
										<Badge
											variant={isPaid ? "secondary" : "outline"}
											className={
												isPaid
													? "bg-emerald-500/10 text-emerald-600 border-none"
													: "bg-amber-500/10 text-amber-700 border-none"
											}
										>
											{isPaid ? "Aprovado" : "Pendente"}
										</Badge>
										{isPaid && order.items.some((item) => item.requiresFulfillment) && order.fulfillmentStatus !== "completed" && (
											<Badge variant="outline" className={order.fulfillmentIssue === "insufficient_balance" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-blue-200 bg-blue-50 text-blue-700"}>
												{order.fulfillmentIssue === "insufficient_balance" ? "Saldo insuficiente" : "Envio pendente"}
											</Badge>
										)}
										</div>
									</TableCell>
									<TableCell className="pr-6 text-right font-medium text-xs">
										{order.total.toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>}
			</CardContent>
		</Card>
	);
}
