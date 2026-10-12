import React, { useState, useMemo } from "react";
import { PlusCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { useTransactions } from "../context/TransactionsContext.jsx";
import "./Transactions.css";

const CATEGORY_OPTIONS = [
  "Food", "Travel", "Shopping", "Bills", "Groceries", "Rent",
  "Entertainment", "Health", "Education", "Utilities", "Insurance",
  "Subscriptions", "Transportation", "Investments", "Salary", "Freelance",
  "Bonuses", "Gifts", "Donations", "Taxes","Vacation","Emergency Fund", "Other"
];

const Transactions = () => {
  const { transactions, loading, addTransaction } = useTransactions();
  const [transactionInput, setTransactionInput] = useState({
    description: "",
    amount: "",
    date: "",
    type: "Expense",
    category: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [exportMonth, setExportMonth] = useState(""); // YYYY-MM

  // Smart categorization
  const categorizeAndType = (description = "") => {
    const d = description.toLowerCase();
    let type = "Expense";
    let category = "Other";

    if (d.includes("salary") || d.includes("freelance") || d.includes("bonus") || d.includes("payment") || d.includes("credit")) {
      type = "Income"; category = "Salary";
    } else if (d.includes("zomato") || d.includes("swiggy") || d.includes("restaurant") || d.includes("food")) category = "Food";
    else if (d.includes("uber") || d.includes("ola") || d.includes("flight") || d.includes("train") || d.includes("bus")) category = "Travel";
    else if (d.includes("rent") || d.includes("flat") || d.includes("lease")) category = "Rent";
    else if (d.includes("amazon") || d.includes("flipkart") || d.includes("mall") || d.includes("store")) category = "Shopping";
    else if (d.includes("electricity") || d.includes("wifi") || d.includes("bill") || d.includes("water")) category = "Bills";
    else if (d.includes("insurance") || d.includes("policy")) category = "Insurance";
    else if (d.includes("netflix") || d.includes("spotify") || d.includes("prime") || d.includes("subscription")) category = "Subscriptions";
    else if (d.includes("school") || d.includes("college") || d.includes("course") || d.includes("tuition")) category = "Education";
    else if (d.includes("stock") || d.includes("crypto") || d.includes("mutual")) category = "Investments";
    else if (d.includes("doctor") || d.includes("hospital") || d.includes("clinic") || d.includes("medicine")) category = "Health";
    else if (d.includes("donate") || d.includes("charity")) category = "Donations";
    else if (d.includes("tax") || d.includes("itr") || d.includes("gst")) category = "Taxes";

    return { type, category };
  };

  // Add single transaction
  const handleAddTransaction = async () => {
    if (!transactionInput.description || !transactionInput.amount) return alert("Enter description & amount");
    const { type } = categorizeAndType(transactionInput.description);

    await addTransaction({
      description: transactionInput.description,
      amount: Number(transactionInput.amount),
      date: transactionInput.date || new Date(),
      type: transactionInput.type,
      // Leave category empty so the backend can use Gemini for automatic categorization.
      ...(transactionInput.category ? { category: transactionInput.category } : {}),
    });

    setTransactionInput({ description: "", amount: "", date: "", type: "Expense", category: "" });
  };

  // CSV / XLSX Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg("Uploading & categorizing...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      let data = [];

      if (file.name.endsWith(".csv")) {
        data = event.target.result.split("\n").slice(1)
          .filter(line => line.trim() !== "")
          .map(line => {
            const [date, description, amount] = line.split(",");
            const { type } = categorizeAndType(description);
            return { date, description, amount: Number(amount), type };
          });
      } else {
        const workbook = XLSX.read(event.target.result, { type: "binary" });
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
        data = sheet.map(row => {
          const desc = row.Description || row.description || "";
          const { type } = categorizeAndType(desc);
          return {
            description: desc,
            amount: Number(row.Amount || row.amount || 0),
            date: row.Date || row.date || new Date(),
            type,
            ...(row.Category || row.category ? { category: row.Category || row.category } : {})
          };
        });
      }

      for (const t of data) await addTransaction(t);
      setUploadMsg(`Uploaded ${data.length} rows`);
      setUploading(false);
      setTimeout(() => setUploadMsg(""), 4000);
    };

    if (file.name.endsWith(".csv")) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };

  // Filtered & searched transactions
  const filteredTransactions = useMemo(() => 
    transactions
      .filter(t => filterType === "All" ? true : t.type === filterType)
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || (t.category || "").toLowerCase().includes(searchTerm.toLowerCase()))
  , [transactions, filterType, searchTerm]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = {};
    transactions.forEach(t => { const cat = t.category || "Other"; map[cat] = (map[cat] || 0) + Number(t.amount || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === "Income").reduce((sum, t) => sum + Number(t.amount), 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + Number(t.amount), 0), [transactions]);
  const balance = totalIncome - totalExpense;

  // Export filtered by month
  const handleExport = (format = "xlsx") => {
    if (!exportMonth) return alert("Select month (YYYY-MM) first");
    const [year, month] = exportMonth.split("-").map(Number);
    const exportData = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
      })
      .map(t => ({
        Date: new Date(t.date).toLocaleDateString(),
        Description: t.description,
        Category: t.category,
        Type: t.type,
        Amount: t.amount,
      }));

    if (exportData.length === 0) return alert("No transactions in selected month");

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    XLSX.writeFile(wb, `Transactions-${exportMonth}.${format}`);
  };

  return (
    <div className="finance-dashboard-full">
      {/* Summary */}
       <h1>Transactions</h1>
      <section className="summary-cards">
        <div className="card income"><h4>Total Income</h4><p>₹{totalIncome.toFixed(2)}</p></div>
        <div className="card expense"><h4>Total Expense</h4><p>₹{totalExpense.toFixed(2)}</p></div>
        <div className="card balance"><h4>Balance</h4><p>₹{balance.toFixed(2)}</p></div>
      </section>

      {/* Add Transaction */}
      <section className="add-transaction card">
        <h3><PlusCircle /> Add Transaction</h3>
        <div className="form-grid">
          <input type="text" placeholder="Description" value={transactionInput.description} onChange={e => setTransactionInput({...transactionInput, description: e.target.value})} />
          <select value={transactionInput.category} onChange={e => setTransactionInput({...transactionInput, category: e.target.value})}>
            <option value="">Auto ({categorizeAndType(transactionInput.description).category})</option>
            {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="date" value={transactionInput.date} onChange={e => setTransactionInput({...transactionInput, date: e.target.value})} />
          <input type="number" placeholder="Amount" value={transactionInput.amount} onChange={e => setTransactionInput({...transactionInput, amount: e.target.value})} />
          <select value={transactionInput.type} onChange={e => setTransactionInput({...transactionInput, type: e.target.value})}>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
          <button onClick={handleAddTransaction} disabled={loading}>{loading ? "Saving..." : "Add"}</button>
        </div>
      </section>

      {/* Upload */}
      <section className="card">
        <h3>Upload Transactions (CSV/XLSX)</h3>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} />
        {uploadMsg && <div style={{ marginTop: 8, color: "#0a74da" }}>{uploadMsg}</div>}
      </section>

      {/* Filter/Search */}
      <section className="filter-search card">
        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <div className="filter-buttons">
          {["All","Income","Expense"].map(t => <button key={t} onClick={() => setFilterType(t)} className={filterType===t?"active":""}>{t}</button>)}
        </div>
      </section>

      {/* Export by month */}
      <section className="card">
        <h3>Export Transactions</h3>
        <input type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)} />
        <button onClick={() => handleExport("xlsx")}>Export XLSX</button>
        <button onClick={() => handleExport("csv")}>Export CSV</button>
      </section>

      {/* Transactions Table */}
      {/* Transactions table */}
      <section className="transactions-table card">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Date</th>
              <th>Type</th>
              <th style={{textAlign:"right"}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:"center",padding:16}}>No transactions found</td></tr>
            ) : (
              filteredTransactions.map((t,i)=>(
                <tr key={i} className={t.type==="Expense"&&Number(t.amount)>10000?"large-expense":""}>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td>{t.date?new Date(t.date).toLocaleDateString():"-"}</td>
                  <td>{t.type}</td>
                  <td style={{textAlign:"right"}} className={t.type==="Expense"?"expense-amount":"income-amount"}>
                    {t.type==="Expense"?"-":"+"}₹{Number(t.amount).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
      
};

export default Transactions;
