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

export function DashboardInvoices() {
	const { orders } = useStore();

	return (
		<Card className="rounded-none bg-background shadow-none ring-0 sm:col-span-2 xl:col-span-4">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Vendas & Pedidos Recentes</CardTitle>
					<CardDescription>Transações e status de pagamento da plataforma.</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="px-0 pb-2">
				<Table className="border-t">
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
				</Table>
			</CardContent>
		</Card>
	);
}
