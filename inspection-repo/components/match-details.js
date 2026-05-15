import { Spacer, Card, Text } from "@nextui-org/react";
import { useAuth } from "@/context/auth-context";
import {  getDate_wwwddmmyyyy } from "./utils/date-utils";
import { currentMatchDay } from "./utils/mock-utils";
import MatchCardRow from "./match-card-row";
import TeamPostCard from "./team-post-card";

function MatchDetails(props) {
  const { user } = useAuth();
  const { matchData } = props;
  const { match1_posts, match2_posts } = props.userPosts;

  const mdm = matchData.matchDetailsMap;

  const matchesData =
    mdm != undefined
      ? {
          date: mdm.key,
          match_1_data: mdm.match[0],
          match_2_data: mdm.match[1] && mdm.match[1],
        }
      : null;

  var today = getDate_wwwddmmyyyy(new Date());

  //mock date for development
  today = currentMatchDay;

  return (
    <>
      {matchesData && (
        <>
          <Card
            isPressable
            isHoverable
            // css={{ borderColor: matchesData.date === today ? "yellow" : "" }}
            // variant="bordered"
          >
            <Spacer y={0.5} />
            <Text size={15} b color="#ff4ecd">
              {matchesData.date}
            </Text>
            <Spacer y={0.5} />
            <MatchCardRow
              match={"m1"}
              matchesData={matchesData}
              today={today}
              user={user}
              match_posts={match1_posts}
              match_data={matchesData.match_1_data}
            />
            <Spacer y={0.5} />
            {matchesData.match_2_data && (
              <>
                <MatchCardRow
                  match={"m2"}
                  matchesData={matchesData}
                  today={today}
                  user={user}
                  match_posts={match2_posts}
                  match_data={matchesData.match_2_data}
                />
                <Spacer y={0.5} />
              </>
            )}
          </Card>
          <Spacer y={1} />
          {match1_posts && <Text color="warning">Match 1</Text>}
          {match1_posts &&
            match1_posts.map((post) => (
              <TeamPostCard post={post} key={post.email} user={user}/>
            ))}

          <Spacer y={1} />
          {match2_posts && <Text color="warning">Match 2</Text>}
          {match2_posts &&
            match2_posts.map((post) => (
              <TeamPostCard post={post} key={post.email} user={user}/>
            ))}
        </>
      )}
    </>
  );
}


export default MatchDetails;
