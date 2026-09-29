import { prisma } from "./cardImport/cardLoader";

// "In a match" status of human players, stored on User.status so profile and friend pages show
// it. Online/offline is tracked separately by socket-server; this only ever writes IN_GAME and
// OFFLINE (meaning "not in a match").

/** Marks these users as in a match (true) or not (false). Never throws: a status dot only. */
export async function setInGame(userIds: number[], inGame: boolean): Promise<void>
{
    if (userIds.length === 0)
        return;
    try
    {
        await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { status: inGame ? "IN_GAME" : "OFFLINE" } });
    }
    catch (err)
    {
        console.error("presence: status update failed:", err);
    }
}

/** Clears IN_GAME left by a previous run: its matches died with the process. */
export async function resetInGameStatuses(): Promise<void>
{
    try
    {
        await prisma.user.updateMany({ where: { status: "IN_GAME" }, data: { status: "OFFLINE" } });
    }
    catch (err)
    {
        console.error("presence: reset failed:", err);
    }
}
