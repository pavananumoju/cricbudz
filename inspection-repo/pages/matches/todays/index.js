import { Container, Spacer, Text } from "@nextui-org/react";
import {
  getDocFromDB,
  getDocsFromDB,
} from "@/components/utils/firebase-db-utils";
import MatchDetails from "@/components/match-details";
import {
  getDate_dd_month_yyyy,
  getDate_wwwddmmyyyy,
} from "@/components/utils/date-utils";
import { todaysMatchDate } from "@/components/utils/mock-utils";

function Todays(props) {
  const { fixtures, posts } = props;

  const date = todaysMatchDate;

  // console.log(fixtures);
  return (
    <Container justify="center" align="center">
      <Spacer y={1} />
      <Text>Todays Matches</Text>
      <Spacer y={1} />
      <MatchDetails
        matchData={fixtures[0]}
        userPosts={posts}
      />
    </Container>
  );
}

export async function getServerSideProps({context}) {

  console.log(context);
  //mock date

  const date = todaysMatchDate;

  const date_wwwddmmyyyy = getDate_wwwddmmyyyy(date);

  const docSnap = await getDocFromDB("Fixtures", "2023");
  const allMatchesDetails = docSnap.data().matchDetails;
  const matchDetails = allMatchesDetails.filter((matchData) => {
    {
      return (
        matchData.matchDetailsMap &&
        matchData.matchDetailsMap.key === date_wwwddmmyyyy
      );
    }
  });

  const date_dd_month_yyyy = getDate_dd_month_yyyy(date);

  const match1_posts = [];
  const match2_posts = [];
  const querySnapshot1 = await getDocsFromDB(`/Posts/${date_dd_month_yyyy}/m1`);
  const querySnapshot2 = await getDocsFromDB(`/Posts/${date_dd_month_yyyy}/m2`);

  querySnapshot1.forEach((doc) => {
    match1_posts.push(doc.data());
  });
  querySnapshot2.forEach((doc) => {
    match2_posts.push(doc.data());
  });

  return {
    props: { fixtures: matchDetails, posts: { match1_posts, match2_posts } },
  };
}

export default Todays;
