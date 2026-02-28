"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");

const handleLogin = async (e: React.FormEvent) => {
e.preventDefault();
setMessage("Connecting...");
try {
const response = await axios.post("http://localhost:8080/api/auth/register", {
email: email,
password: password,
role: "STUDENT",
name: "New Student"
});
setMessage("Success: " + response.data);
} catch (error: any) {
setMessage("Error: " + (error.response?.data || "Backend unreachable"));
}
};

return (
<div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-6 relative overflow-hidden">
</div>
);
}