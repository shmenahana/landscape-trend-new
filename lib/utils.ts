import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateHours(start: Date, end: Date, breakMinutes: number = 0): number {
  const diff = end.getTime() - start.getTime()
  const hours = diff / (1000 * 60 * 60)
  return Math.max(0, hours - (breakMinutes / 60))
}

export function generateEstimateNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `EST-${year}${month}-${random}`
}

export function generateJobNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `JOB-${year}${month}-${random}`
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

export function calculateEstimateTotal(
  subtotal: number,
  overheadPercent: number,
  profitPercent: number,
  taxPercent: number = 0
) {
  const overheadAmount = subtotal * (overheadPercent / 100)
  const profitAmount = (subtotal + overheadAmount) * (profitPercent / 100)
  const beforeTax = subtotal + overheadAmount + profitAmount
  const tax = beforeTax * (taxPercent / 100)
  const total = beforeTax + tax

  return {
    overheadAmount,
    profitAmount,
    tax,
    total,
  }
}
