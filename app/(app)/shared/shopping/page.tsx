import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getActivePartnership } from "@/lib/data/partnership";
import { SHOPPING_CATEGORY_META } from "@/lib/shopping";
import { getFrequentlyBought } from "@/lib/data/shopping";
import { AddItemForm } from "./_components/add-item-form";
import { ItemRow } from "./_components/item-row";
import { addSuggestedItem, clearPurchased } from "./actions";

export const metadata = { title: "장보기 · LifeOS" };

export default async function ShoppingPage() {
  const partnership = await getActivePartnership();
  if (!partnership) {
    return (
      <main className="px-6 pt-10">
        <Card className="text-center text-sm text-foreground-muted">
          파트너십이 필요해요.
        </Card>
      </main>
    );
  }

  const [items, suggestions] = await Promise.all([
    prisma.shoppingItem.findMany({
      where: { partnershipId: partnership.id },
      orderBy: [{ purchased: "asc" }, { createdAt: "desc" }],
    }),
    getFrequentlyBought(),
  ]);

  const unpurchased = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);

  // Group unpurchased by category for friendlier shopping flow.
  const grouped = unpurchased.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.category ?? "OTHER";
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  return (
    <main className="flex flex-col gap-6 px-6 pt-10">
      <header>
        <Link href="/shared" className="text-foreground-muted text-xs">
          ‹ 우리
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">🛒 장보기</h1>
        <p className="text-xs text-foreground-muted">
          남은 {unpurchased.length}개 · 산 것 {purchased.length}개
        </p>
      </header>

      <Card>
        <AddItemForm />
      </Card>

      {suggestions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-baseline gap-2 text-sm font-medium">
            ✨ 자주 사는 것
            <span className="text-[10px] text-foreground-weak">
              탭하면 바로 담아요
            </span>
          </h2>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s.name}>
                <form action={addSuggestedItem}>
                  <input type="hidden" name="name" value={s.name} />
                  {s.category && (
                    <input type="hidden" name="category" value={s.category} />
                  )}
                  {s.lastQuantity && (
                    <input type="hidden" name="quantity" value={s.lastQuantity} />
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-bg-lavender px-3 py-1.5 text-xs text-foreground hover:bg-bg-lavender/80"
                  >
                    {s.category
                      ? SHOPPING_CATEGORY_META[s.category].emoji
                      : "🛒"}{" "}
                    {s.name}
                    <span className="text-[10px] text-foreground-weak">
                      ×{s.count}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        {Object.entries(grouped).length === 0 ? (
          <Card className="text-center text-sm text-foreground-muted">
            아직 살 게 없어요!
          </Card>
        ) : (
          Object.entries(grouped).map(([cat, list]) => {
            const meta =
              SHOPPING_CATEGORY_META[
                cat as keyof typeof SHOPPING_CATEGORY_META
              ];
            return (
              <div key={cat} className="flex flex-col gap-2">
                <h2 className="flex items-center gap-1 text-sm font-medium">
                  <span className="text-base">{meta.emoji}</span> {meta.label}
                </h2>
                <ul className="flex flex-col gap-1">
                  {list.map((item) => (
                    <ItemRow
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      quantity={item.quantity}
                      note={item.note}
                      purchased={item.purchased}
                    />
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {purchased.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground-muted">
              산 것 ({purchased.length})
            </h2>
            <form action={clearPurchased}>
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="text-foreground-weak hover:text-pink"
              >
                전체 비우기
              </Button>
            </form>
          </div>
          <ul className="flex flex-col gap-1">
            {purchased.slice(0, 10).map((item) => (
              <ItemRow
                key={item.id}
                id={item.id}
                name={item.name}
                quantity={item.quantity}
                note={item.note}
                purchased={item.purchased}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
