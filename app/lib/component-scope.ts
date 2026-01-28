import React, { useState, useEffect, useCallback, useMemo } from "react";

/**
 * UI Component Library - These are the components available to dynamic code
 * The AI can only use these components, providing a security boundary
 */

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: ButtonProps) {
  const baseStyles = "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return React.createElement(
    "button",
    {
      onClick,
      disabled,
      className: `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`,
    },
    children
  );
}

// Card Component
interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

function Card({ children, title, className = "" }: CardProps) {
  return React.createElement(
    "div",
    {
      className: `bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ${className}`,
    },
    title && React.createElement("h3", { className: "text-lg font-semibold mb-4 text-gray-900 dark:text-white" }, title),
    children
  );
}

// Input Component
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "email" | "password";
  className?: string;
}

function Input({
  value,
  onChange,
  placeholder = "",
  type = "text",
  className = "",
}: InputProps) {
  return React.createElement("input", {
    type,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    placeholder,
    className: `w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
      bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`,
  });
}

// Select Component
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: SelectProps) {
  return React.createElement(
    "select",
    {
      value,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
      className: `w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
        focus:ring-2 focus:ring-blue-500 focus:border-transparent 
        bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`,
    },
    placeholder && React.createElement("option", { value: "" }, placeholder),
    options.map((opt) =>
      React.createElement("option", { key: opt.value, value: opt.value }, opt.label)
    )
  );
}

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "gray" | "purple";
}

function Badge({ children, color = "blue" }: BadgeProps) {
  const colorStyles = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  return React.createElement(
    "span",
    {
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorStyles[color]}`,
    },
    children
  );
}

// Checkbox Component
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return React.createElement(
    "label",
    { className: "flex items-center gap-2 cursor-pointer" },
    React.createElement("input", {
      type: "checkbox",
      checked,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked),
      className: "w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500",
    }),
    label && React.createElement("span", { className: "text-gray-700 dark:text-gray-300" }, label)
  );
}

// List Component
interface ListProps {
  children: React.ReactNode;
  className?: string;
}

function List({ children, className = "" }: ListProps) {
  return React.createElement(
    "ul",
    { className: `space-y-2 ${className}` },
    children
  );
}

interface ListItemProps {
  children: React.ReactNode;
  className?: string;
}

function ListItem({ children, className = "" }: ListItemProps) {
  return React.createElement(
    "li",
    {
      className: `p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${className}`,
    },
    children
  );
}

// Header Component
interface HeaderProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

function Header({ children, level = 1, className = "" }: HeaderProps) {
  const sizeStyles = {
    1: "text-3xl font-bold",
    2: "text-2xl font-semibold",
    3: "text-xl font-medium",
  };

  return React.createElement(
    `h${level}`,
    { className: `${sizeStyles[level]} text-gray-900 dark:text-white ${className}` },
    children
  );
}

// Loading Spinner
function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeStyles = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  
  return React.createElement(
    "div",
    {
      className: `${sizeStyles[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`,
    }
  );
}

// Flex Container
interface FlexProps {
  children: React.ReactNode;
  direction?: "row" | "col";
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  className?: string;
}

function Flex({
  children,
  direction = "row",
  gap = 2,
  align = "start",
  justify = "start",
  className = "",
}: FlexProps) {
  const alignStyles = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  const justifyStyles = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };

  return React.createElement(
    "div",
    {
      className: `flex ${direction === "col" ? "flex-col" : "flex-row"} gap-${gap} ${alignStyles[align]} ${justifyStyles[justify]} ${className}`,
    },
    children
  );
}

/**
 * Safe API fetch wrapper
 * Only allows fetching from /api/* endpoints
 */
async function fetchAPI(
  endpoint: string,
  options?: { method?: string; body?: unknown }
): Promise<unknown> {
  const url = endpoint.startsWith("/api/") ? endpoint : `/api/${endpoint}`;
  
  // Security: only allow /api/* endpoints
  if (!url.startsWith("/api/")) {
    throw new Error("Only /api/* endpoints are allowed");
  }

  const response = await fetch(url, {
    method: options?.method || "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  return response.json();
}

/**
 * The scope object passed to dynamically compiled components
 * These are the only APIs available to user-generated code
 */
export const componentScope = {
  // React
  React,
  useState,
  useEffect,
  useCallback,
  useMemo,

  // UI Components
  Button,
  Card,
  Input,
  Select,
  Badge,
  Checkbox,
  List,
  ListItem,
  Header,
  Spinner,
  Flex,

  // API Access
  fetchAPI,

  // Utilities
  console: {
    log: (...args: unknown[]) => console.log("[DynamicUI]", ...args),
    error: (...args: unknown[]) => console.error("[DynamicUI]", ...args),
  },
};

export type ComponentScope = typeof componentScope;
