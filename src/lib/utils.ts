import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTeamLogo(teamCode: string, logoId?: number): string {
  if (logoId) {
    return `https://static.cricbuzz.com/a/img/v1/72x72/i1/c${logoId}/team.jpg`;
  }
  
  const logos: Record<string, string> = {
    'RCB': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860061/royal-challengers-bangalore.jpg',
    'MI': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860060/mumbai-indians.jpg',
    'CSK': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860058/chennai-super-kings.jpg',
    'KKR': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860059/kolkata-knight-riders.jpg',
    'SRH': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860066/sunrisers-hyderabad.jpg',
    'DC': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860062/delhi-capitals.jpg',
    'PBKS': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860065/punjab-kings.jpg',
    'RR': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860055/rajasthan-royals.jpg',
    'GT': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860068/gujarat-titans.jpg',
    'LSG': 'https://static.cricbuzz.com/a/img/v1/72x72/i1/c860070/lucknow-super-giants.jpg',
  };
  return logos[teamCode] || `https://ui-avatars.com/api/?name=${teamCode}&background=random`;
}
