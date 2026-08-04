"use client";

import { useEffect } from "react";
import { migrerStockageLocal } from "../../lib/storage";

export default function StorageMigration() {
  useEffect(() => {
    migrerStockageLocal();
  }, []);

  return null;
}
