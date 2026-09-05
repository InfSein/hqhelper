import type { Component } from "vue"
import type { ItemInfo } from "@/tools/item"

export interface ItemGroup {
  title: string;
  key: string;
  items: ItemInfo[];
}

export interface RecommItemGroup {
  type:
    "gather-common" | "gather-limited" | "aethersand" |
    "craft-target" | "craft-precraft" | "craft-preprecraft" | "craft-prepreprecraft" |
    "trade-tomescript" | "other",
  title: string,
  subtitle?: Component,
  icon: string,
  description?: string,
  items: ItemInfo[]
}