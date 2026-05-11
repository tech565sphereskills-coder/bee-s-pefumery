import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  MessageCircle,
  ShoppingBag,
  Mail,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const token = useAuth((s) => s.token);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("customers/");
        setCustomers(res.data);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [token]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="eyebrow animate-pulse">Retrieving customer database...</p>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl text-noir">Customer Base</h2>
          <p className="text-gray-400 text-sm">
            Comprehensive view of your luxury clientele and purchasing behavior.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-medium hover:border-gold transition-all">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-gold/20 transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-xl text-sm font-medium hover:border-gold transition-all shadow-sm">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Customer
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Contact
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 text-center">
                  Orders
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 text-right">
                  Total Lifetime Value
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 text-center">
                  Joined
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-noir text-gold flex items-center justify-center font-bold text-xs">
                        {customer.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-noir text-sm">{customer.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-0.5">
                      <p className="text-sm text-noir flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-300" /> {customer.email}
                      </p>
                      <p className="text-xs text-gray-400">{customer.phone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-noir">
                      <ShoppingBag className="h-3 w-3" /> {customer.orders}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-noir text-sm">
                    ₦{customer.total.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-center text-xs text-gray-400">
                    {new Date(customer.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`https://wa.me/${customer.phone?.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-green-50 rounded-lg text-gray-300 hover:text-green-500 transition-all"
                        title="WhatsApp Chat"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-noir transition-all">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-gray-400 text-sm font-serif italic">
                      No customers matched your criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-50">
          {paginatedCustomers.map((customer) => (
            <div key={customer.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-noir text-gold flex items-center justify-center font-bold text-sm">
                    {customer.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-medium text-noir">{customer.name}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">#{customer.id.slice(-6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-noir">₦{customer.total.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Lifetime Value</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">Contact</p>
                  <p className="text-xs text-noir truncate">{customer.email}</p>
                  <p className="text-[10px] text-gray-500">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1">Activity</p>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium">
                    <ShoppingBag className="h-3 w-3" /> {customer.orders} Orders
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <a
                  href={`https://wa.me/${customer.phone?.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {paginatedCustomers.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm font-serif italic">
              No customers found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-noir">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-noir">
                {Math.min(startIndex + itemsPerPage, filteredCustomers.length)}
              </span>{" "}
              of <span className="font-medium text-noir">{filteredCustomers.length}</span> luxury
              clients
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-medium transition-all",
                      currentPage === i + 1
                        ? "bg-noir text-white shadow-md"
                        : "text-gray-400 hover:bg-white hover:text-noir",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
