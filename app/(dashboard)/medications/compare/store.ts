"use client";

export function addToCompare(nregistro: string) {
  let current = JSON.parse(localStorage.getItem("compare") || "[]");

  if (!current.includes(nregistro)) {
    current.push(nregistro);
    localStorage.setItem("compare", JSON.stringify(current));
  }
}

export function getCompareList() {
  return JSON.parse(localStorage.getItem("compare") || "[]");
}

export function clearCompare() {
  localStorage.removeItem("compare");
}
