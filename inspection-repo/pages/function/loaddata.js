import { getDocRef, setDocToDB } from "@/components/utils/firebase-db-utils";

function LoadData () {

    const data = 
    // {
    //     "IPLTeams": 
        [
          {
            "teamId": 58,
            "teamName": "Chennai Super Kings",
            "teamSName": "CSK",
            "imageId": 225641,
            "countryName": "India",
            "belongsTo": "IPL"
          },
          {
            "teamId": 61,
            "teamName": "Delhi Capitals",
            "teamSName": "DC",
            "imageId": 225644,
            "countryName": "India",
            "belongsTo": "IPL"
          },
          {
            "teamId": 65,
            "teamName": "Punjab Kings",
            "teamSName": "PBKS",
            "imageId": 225648,
            "countryName": "India",
            "belongsTo": "IPL"
          },
          {
            "teamId": 63,
            "teamName": "Kolkata Knight Riders",
            "teamSName": "KKR",
            "imageId": 225646,
            "countryName": "India",
            "belongsTo": "IPL"
          },
          {
            "teamId": 62,
            "teamName": "Mumbai Indians",
            "teamSName": "MI",
            "imageId": 225645,
            "countryName": "India",
            "belongsTo": "IPL"
          },
          {
            "teamId": 64,
            "teamName": "Rajasthan Royals",
            "teamSName": "RR",
            "imageId": 225647,
            "countryName": "India",
            "belongsTo": "IPL"
          },
          {
            "teamId": 59,
            "teamName": "Royal Challengers Bangalore",
            "teamSName": "RCB",
            "imageId": 225643,
            "countryName": "India",
            "belongsTo": "IPL"
          },
          {
            "teamId": 255,
            "teamName": "Sunrisers Hyderabad",
            "teamSName": "SRH",
            "imageId": 225649,
            "countryName": "India"
          },
          {
            "teamId": 966,
            "teamName": "Lucknow Super Giants",
            "teamSName": "LSG",
            "imageId": 228727,
            "countryName": "India"
          },
          {
            "teamId": 971,
            "teamName": "Gujarat Titans",
            "teamSName": "GT",
            "imageId": 235085,
            "countryName": "India"
          }
        ]
    //   }


    

    data.map(team => {
        // const docRef = getDocRef("IPLTeams", `${team.teamId}`);
        // setDocToDB(docRef, team);    
    });
      // const docRef = getDocRef("Fixtures", '2023');
    //   setDocToDB(docRef, data);

    return (<div>Data loaded successfully...</div>);
}

export default LoadData;