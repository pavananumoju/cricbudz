import PlayerList from "@/components/player-list";
import { useRouter } from "next/router";
import { Button, Container, Spacer } from "@nextui-org/react";
import { getDocFromDB } from "@/components/utils/firebase-db-utils";
import {
  getDataFromAPI,
  getDocsFromDB,
} from "@/components/utils/firebase-db-utils";

function TeamPage(props) {
  const router = useRouter();
  const { squad } = props;
  // console.log(squad);
  return (
    <Container justify="center" align="center" gap={0}>
      <Spacer y={1} />
      <Button
        shadow
        color="success"
        onPress={() => {
          router.push("/teams");
        }}
        auto
        ghost
      >
        All Teams
      </Button>
      <PlayerList squad={squad} />
    </Container>
  );
}

export async function getStaticProps(context) {
  const { squadId } = context.params;
  // getDataFromAPI(squadId);
  const docSnap = await getDocFromDB("Squads", squadId);
  const teamData = docSnap.data().player;
  return { props: { squad: teamData } };
}

export async function getStaticPaths() {
  const querySnapshot = await getDocsFromDB("Teams");
  let teams = [];
  querySnapshot.forEach((doc) => {
    teams.push(doc.data());
  });

  const paths = teams.map((team) => {
    return { params: { squadId: team.squadId.toString() } };
  });

  return { paths, fallback: true };
}

export default TeamPage;
