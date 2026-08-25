'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus, FailureType } from '../types';
import { SYNTHETIC_ORDERS } from '../lib/synthetic-orders';

export interface OrderTableProps {
  orders?: Order[];
  onOrderClick?: (orderId: string) => void;
}

type FilterTab = 'all' | OrderStatus;

const FAILURE_TYPE_LABELS: Record<FailureType, string> = {
  upi_timeout: 'UPI Timeout',
  card_declined: 'Card Declined',
  card_expired: 'Card Expired',
  insufficient_funds: 'Insufficient Funds',
  user_abandoned: 'User Abandoned',
  bank_server_error: 'Bank Server Error',
  mandate_failed: 'Mandate Failed',
};

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return (
        <span className="bg-yellow-950/80 text-yellow-400 border border-yellow-800/80 text-xs px-2 py-0.5 rounded font-mono font-medium uppercase tracking-wider">
          Pending
        </span>
      );
    case 'processing':
      return (
        <span className="bg-blue-950/80 text-blue-400 border border-blue-800/80 text-xs px-2 py-0.5 rounded font-mono font-medium uppercase tracking-wider">
          Processing
        </span>
      );
    case 'recovered':
      return (
        <span className="bg-green-950/80 text-green-400 border border-green-800/80 text-xs px-2 py-0.5 rounded font-mono font-medium uppercase tracking-wider">
          Recovered
        </span>
      );
    case 'failed':
      return (
        <span className="bg-red-950/80 text-red-400 border border-red-800/80 text-xs px-2 py-0.5 rounded font-mono font-medium uppercase tracking-wider">
          Failed
        </span>
      );
    case 'escalated':
      return (
        <span className="bg-orange-950/80 text-orange-400 border border-orange-800/80 text-xs px-2 py-0.5 rounded font-mono font-medium uppercase tracking-wider">
          Escalated
        </span>
      );
    default:
      return (
        <span className="bg-gray-800 text-gray-300 border border-gray-700 text-xs px-2 py-0.5 rounded font-mono font-medium uppercase tracking-wider">
          {status}
        </span>
      );
  }
}

export function OrderTable({
  orders = SYNTHETIC_ORDERS,
  onOrderClick,
}: OrderTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  // Tab count metrics
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: orders.length,
      pending: 0,
      processing: 0,
      recovered: 0,
      failed: 0,
      escalated: 0,
    };
    orders.forEach((o) => {
      if (map[o.status] !== undefined) {
        map[o.status] += 1;
      }
    });
    return map;
  }, [orders]);

  // Filtered orders list based on active tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const handleRowClick = (orderId: string) => {
    if (onOrderClick) {
      onOrderClick(orderId);
    } else {
      router.push(`/audit/${orderId}`);
    }
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: `All ${orders.length}` },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'recovered', label: 'Recovered' },
    { id: 'failed', label: 'Failed' },
    { id: 'escalated', label: 'Escalated' },
  ];

  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg w-full shadow-sm overflow-hidden">
      {/* Header & Filter Tabs */}
      <div className="p-4 border-b border-[#2E2E2E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-100">
            Orders Batch Execution
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            30 synthetic failed orders dataset • Amounts in test-mode simulation
          </p>
        </div>

        {/* Navigation Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-[#0F0F0F] p-1 rounded-md border border-[#2E2E2E]">
          {tabs.map((tab) => {
            const count = counts[tab.id] ?? 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1A1A1A]'
                }`}
              >
                <span>{tab.id === 'all' ? `All ${orders.length}` : tab.label}</span>
                {tab.id !== 'all' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-blue-800/80 text-white'
                        : 'bg-[#1A1A1A] text-gray-400 border border-[#2E2E2E]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#0F0F0F] text-gray-400 uppercase text-[11px] font-mono border-b border-[#2E2E2E]">
            <tr>
              <th scope="col" className="py-3 px-4 font-semibold">
                Order ID
              </th>
              <th scope="col" className="py-3 px-4 font-semibold">
                Customer
              </th>
              <th scope="col" className="py-3 px-4 font-semibold">
                Amount
              </th>
              <th scope="col" className="py-3 px-4 font-semibold">
                Failure Type
              </th>
              <th scope="col" className="py-3 px-4 font-semibold text-center">
                Attempts
              </th>
              <th scope="col" className="py-3 px-4 font-semibold">
                Status
              </th>
              <th scope="col" className="py-3 px-4 font-semibold text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500 font-mono">
                  No orders match the selected filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => handleRowClick(order.id)}
                  className="hover:bg-[#252525] transition-colors cursor-pointer group"
                >
                  {/* Order ID */}
                  <td className="py-3 px-4 font-mono font-semibold text-blue-400 whitespace-nowrap">
                    {order.id}
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4 font-medium text-gray-200">
                    <div>{order.customer_name}</div>
                    <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>{order.language.toUpperCase()}</span>
                      <span>•</span>
                      <span>{order.preferred_channel.toUpperCase()}</span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 font-mono font-semibold text-gray-100 whitespace-nowrap">
                    {formatINR(order.amount)}
                  </td>

                  {/* Failure Type */}
                  <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                    <span className="bg-[#0F0F0F] border border-[#2E2E2E] px-2 py-1 rounded text-[11px] font-mono">
                      {FAILURE_TYPE_LABELS[order.failure_type] || order.failure_type}
                    </span>
                  </td>

                  {/* Attempts */}
                  <td className="py-3 px-4 text-center font-mono font-semibold whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        order.previous_attempts >= 2
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                          : 'bg-[#0F0F0F] text-gray-300 border border-[#2E2E2E]'
                      }`}
                    >
                      {order.previous_attempts}/3
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>

                  {/* Action Arrow */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all inline-block font-mono text-sm">
                      →
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Notice */}
      <div className="p-3 bg-[#0F0F0F] border-t border-[#2E2E2E] text-[11px] text-gray-500 font-mono flex items-center justify-between">
        <span>Showing {filteredOrders.length} of {orders.length} orders</span>
        <span>Test-mode simulation values only</span>
      </div>
    </div>
  );
}

export default OrderTable;
