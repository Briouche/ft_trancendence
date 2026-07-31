import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const cards = await prisma.card.findMany({
    orderBy: { rarity: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-2">Ma Collection</h1>
      <p className="text-gray-400 mb-8">{cards.length} cartes disponibles</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-xl p-3 flex flex-col gap-1 shadow-lg"
            style={{ backgroundColor: card.color || "#374151" }}
          >
            <span className="text-3xl">{card.emoji}</span>
            <span className="font-bold text-xs text-gray-900 leading-tight">
              {card.name}
            </span>
            <span className="text-xs text-gray-700 italic">{card.rarity}</span>
            <div className="flex justify-between text-xs font-mono mt-auto pt-2 border-t border-black/20">
              <span>⚔️{card.atk}</span>
              <span>🛡️{card.def}</span>
              <span>💎{card.cost}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
