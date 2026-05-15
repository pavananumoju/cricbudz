import TeamSelect from "@/components/team/team-select";
import { useRouter } from "next/router";

const SelectionPage = () => {
  const router = useRouter();

  const { date, match, team1, team2 } = router.query;

  return <TeamSelect teamProps={{date, match, team1, team2 }}/>;
};

export default SelectionPage;
