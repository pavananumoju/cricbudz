import { Col, Text, Button, Row, Loading } from "@nextui-org/react";
import { useRouter } from "next/router";
import { getDate_dd_month_yyyy } from "./utils/date-utils";
import { team_result_SRH_RR } from "@/mock-data/team_result_SRH_RR";
import { team_result_RCB_MI } from "@/mock-data/team_result_RCB_MI";
import {
  getDocsFromDBUsingWhere,
  updateDocToDB,
} from "./utils/firebase-db-utils";
import { useState } from "react";

function MatchCardRow(props) {
  const { matchesData, today, match, user, match_posts, match_data } = props;
  const [calculateStatus, setCalculateStatus] = useState(false);

  // console.log(match_data);

  const router = useRouter();
  const dateObj = new Date(matchesData.date);
  const date_dd_month_yyyy = getDate_dd_month_yyyy(dateObj);

  function handleMatchClick(match, team1_id, team2_id) {
    router.push(
      `/function/team-selection-page/?date=${date_dd_month_yyyy}&match=${match}&team1=${team1_id}&team2=${team2_id}`
    );
  }

  function handleCalulatePoints(matchId) {
    console.log("Calculate..");
    //get all posts of match 1 / match 2 and add to a unique set. Obj_1
    var arrL = [];
    match_posts.map((post) => arrL.push(post.p1.id, post.p2.id, post.p3.id));
    var playerSet = new Set(arrL);

    //make API call to fetch match 1 / match 2 results. Obj_2
    //use Obj_1 to iterate through Obj_2 data and calculate scores/points
    getResultsFromAPI(matchId).then((matchResultsData) => {
      for (var player of playerSet) {
        var playerId = "";
        var playerName = "";
        var playerScore = 0;
        var runsScored = 0;
        var is50 = false;
        var is100 = false;
        var wicketsTaken = 0;
        var is3WH = false;
        var is5WH = false;
        var isMOM = false;
        for (var i = 0; i < matchResultsData.scoreCard.length; i++) {
          for (var prop in matchResultsData.scoreCard[i].batTeamDetails
            .batsmenData) {
            if (
              player.toString() ===
              matchResultsData.scoreCard[i].batTeamDetails.batsmenData[
                prop
              ].batId.toString()
            ) {
              playerId =
                matchResultsData.scoreCard[i].batTeamDetails.batsmenData[prop]
                  .batId;
              playerName =
                matchResultsData.scoreCard[i].batTeamDetails.batsmenData[prop]
                  .batName;
              runsScored =
                matchResultsData.scoreCard[i].batTeamDetails.batsmenData[prop]
                  .runs;
              is50 = runsScored >= 50 && runsScored < 100;
              is100 = runsScored >= 100;

              playerScore =
                playerScore + runsScored + (is50 && 5) + (is100 && 10);

              // console.log(batsmanId, playerName, runsScored, is50, is100);
            }
          }
          for (var prop in matchResultsData.scoreCard[i].bowlTeamDetails
            .bowlersData) {
            if (
              player.toString() ===
              matchResultsData.scoreCard[i].bowlTeamDetails.bowlersData[
                prop
              ].bowlerId.toString()
            ) {
              wicketsTaken =
                matchResultsData.scoreCard[i].bowlTeamDetails.bowlersData[prop]
                  .wickets;
              is3WH = wicketsTaken >= 3 && wicketsTaken < 5;
              is5WH = wicketsTaken >= 5;
              // console.log(bowlerId, bowlerName, wicketsTaken, is5WH, is3WH);

              playerScore =
                playerScore + wicketsTaken * 10 + (is3WH && 10) + (is5WH && 20);
            }
          }
        }
        if (
          player.toString() ===
          matchResultsData.matchHeader.playersOfTheMatch[0].id.toString()
        ) {
          // console.log(matchResultsData.matchHeader.playersOfTheMatch[0].name+' is MOM');
          isMOM = true;
          playerScore = playerScore + 10;
        }
        //single player loop ends here
        // console.log(
        //   player +
        //     " - " +
        //     playerName +
        //     " (" +
        //     playerScore +
        //     ")" +
        //     ", runs: " +
        //     runsScored +
        //     ", 50: " +
        //     is50 +
        //     ", 100: " +
        //     is100 +
        //     ", wk: " +
        //     wicketsTaken +
        //     ", 3WH: " +
        //     is3WH +
        //     ", 5WH: " +
        //     is5WH +
        //     ", MOM: " +
        //     isMOM
        // );
        
        //save the score and points details in a table to be able to view later by users
        savePlayerResultsToDB(date_dd_month_yyyy, match, playerId, playerScore).then(res => {
          setCalculateStatus(true);
        });
        // /Posts/01_April_2023/m1/pavan@cb.com
      }
      //All Players loop ends here
    });
  }

  return (
    <Row align="center">
      <Col>
        <Text>{match === "m1" ? "Match - 1" : "Match - 2"}</Text>
      </Col>
      <Col>
        <Button
          disabled={matchesData.date != today}
          size="sm"
          // auto
          onPress={() =>
            handleMatchClick(
              match,
              match_data.matchInfo.team1.teamId,
              match_data.matchInfo.team2.teamId
            )
          }
        >
          {match_data.matchInfo.team1.teamSName} vs{" "}
          {match_data.matchInfo.team2.teamSName}
        </Button>
      </Col>
      {user.isAdmin && (
        <Col>
          {!calculateStatus && (
            <Button
              size={"xs"}
              onPress={() => handleCalulatePoints(match_data.matchInfo.matchId)}
            >
              Calculate
            </Button>
          )}
          {calculateStatus && <Text color="success">Calculated</Text>}
        </Col>
      )}
    </Row>
  );
}

async function getResultsFromAPI(matchId) {
  /*
  const res = await fetch(
    `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/scard`,
    // `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/66169/scard`,
    {
      headers: {
        "X-RapidAPI-Key": "e3a774ef7cmshbdc22cb0186c6b8p16fdbbjsn6a99a1ad3518",
        "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
      },
    }
  );
  const data = await res.json();
  return data.scoreCard;
  */

  return matchId.toString() === "66183"
    ? team_result_SRH_RR
    : team_result_RCB_MI;

  // return team_result_LSG_SRH;
}

async function savePlayerResultsToDB(
  date_dd_month_yyyy,
  match,
  playerId,
  playerScore
) {

  ["p1", "p2", "p3"].map(async (player) => {
    const querySnapshot = await getDocsFromDBUsingWhere(
      `/Posts/${date_dd_month_yyyy}/${match}`,
      `${player}.id`,
      playerId.toString()
    );
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      // console.log(doc.id, " >> ", doc.data());
      updateDocToDB(`/Posts/${date_dd_month_yyyy}/${match}`, doc.data().email, {
        [`${player}.points`]: playerScore,
      });
    });
  });
}

export default MatchCardRow;
