import { useEffect, useState } from "react";
import { HackerModel } from "../models/hacker";
import { useNavigate } from "react-router";
import { uri } from "../App";
import { TeamModel } from "../models/team";
import Alert from "../components/Alert";
import Contact from "../components/Contact";
import "../index.css";

interface PartialHackerModel {
  UUID: string;
  email: string;
  firstName: string;
  lastName: string;
  school: string;
  discord: string;
}
function ManageTeam() {
  //Authentication
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [hacker, setHacker] = useState<HackerModel>();
  const [team, setTeam] = useState<TeamModel>();
  const [owner, setOwner] = useState<PartialHackerModel | null>();
  const [teamMember1, setTeamMember1] = useState<PartialHackerModel | null>();
  const [teamMember2, setTeamMember2] = useState<PartialHackerModel | null>();
  const [teamMember3, setTeamMember3] = useState<PartialHackerModel | null>();

  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [function1, setFunction1] = useState<(() => void) | null>(null);
  const [alertButtonMsg, setAlertButtonMsg] = useState("");
  const [function2, setFunction2] = useState<(() => void) | null>(null);
  const [alertButtonMsg2, setAlertButtonMsg2] = useState("");

  const [showContact, setShowContact] = useState(false);
  const [contactContent, setContactContent] =
    useState<PartialHackerModel | null>();

  const [role, setRole] = useState<
    "owner" | "teamMember1" | "teamMember2" | "teamMember3" | undefined
  >(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        navigate("/");
        return;
      }

      // Initial Token Request
      try {
        const res = await fetch(uri + "whoami", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!json.UUID) {
          alert("Session Expired, Logging Out");
          localStorage.removeItem("token");
          navigate("/");
          return;
        }

        // Fetch User Info
        try {
          const hackerRes = await fetch(uri + `hacker?UUID=${json.UUID}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const hackerJSON = await hackerRes.json();

          if (hackerJSON["status"] != 200) {
            alert("Session Expired, Logging Out");
            localStorage.removeItem("token");
            navigate("/");
          } else {
            setHacker(hackerJSON.hacker);
            if (hackerJSON.hacker["isConfirmed"] == false) {
              navigate("/EmailConfirmation");
            }
            if (!hackerJSON.hacker["teamID"]) {
              navigate("/FindTeam");
            }
            // Request Team
            const teamRes = await fetch(
              uri + `team?UUID=${hackerJSON.hacker["UUID"]}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const teamJSON = await teamRes.json();
            console.log(teamJSON);
            if (teamJSON.status == 200) {
              setTeam({
                teamID: teamJSON.team.teamID,
                teamName: teamJSON.team.teamName,
                owner: teamJSON.owner,
                teamMember1: teamJSON.teamMember1,
                teamMember2: teamJSON.teamMember2,
                teamMember3: teamJSON.teamMemer3,
              });
              //console.log(teamJSON);
              setOwner(teamJSON.owner);
              if (teamJSON.owner.UUID == hackerJSON.UUID) {
                setRole("owner");
              }
              if (teamJSON.teamMember1) {
                setTeamMember1(teamJSON.teamMember1);
                if (teamJSON.teamMember1.UUID == hackerJSON.UUID) {
                  setRole("teamMember1");
                }
              }
              if (teamJSON.teamMember2) {
                setTeamMember2(teamJSON.teamMember2);
                if (teamJSON.teamMember2.UUID == hackerJSON.UUID) {
                  setRole("teamMember2");
                }
              }

              if (teamJSON.teamMember3) {
                setTeamMember3(teamJSON.teamMember3);
                if (teamJSON.teamMember3.UUID == hackerJSON.UUID) {
                  setRole("teamMember3");
                }
              }
            }
          }
        } catch {
          alert("Session Expired, Logging Out");
          localStorage.removeItem("token");
          navigate("/");
        }
      } catch {
        alert("Session Expired, Logging Out");
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate, token]);

  const resetAlertState = () => {
    setAlertMsg("");
    setAlertButtonMsg("");
    setFunction1(() => {});
    setAlertButtonMsg2("");
    setFunction2(() => {});
  };
  const makeOwnerAlertFirstBecauseFuckingMobileHasToLikeNeedAnAlert = (
    newPerson: PartialHackerModel
  ) => {
    setAlertMsg(
      "Are you sure you want to make " +
        newPerson.firstName +
        newPerson.lastName +
        " owner of the team?"
    );
    setAlertButtonMsg("No");
    setFunction1(() => () => {
      resetAlertState();
      setShowAlert(false);
    });
    setAlertButtonMsg2("Yes");
    setFunction2(() => () => {
      makeOwner(newPerson);
      setShowAlert(false);
    });
    setShowAlert(true);
  };

  const makeOwner = async (newPerson: PartialHackerModel) => {
    resetAlertState();
    if (!hacker || !team) {
      console.error("TS MISSING");
      return;
    }

    try {
      console.log(owner?.UUID);
      console.log(newPerson?.UUID);
      console.log(team.teamID);
      const newOwnerRes = await fetch(`${uri}team/owner`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          owner: owner?.UUID,
          teamMember: newPerson?.UUID,
          teamID: team.teamID,
        }),
      });

      const data = await newOwnerRes.json();
      console.log(data);
      if (data.status === 200) {
        setAlertMsg(
          "Ownership successfully transferred to " +
            newPerson.firstName +
            " " +
            newPerson.lastName
        );
        setAlertButtonMsg("Ok");
        setFunction1(() => () => window.location.reload());
        setShowAlert(true);
      } else {
        console.error(
          "FUCK YOU YOU'RE STUPID I HATE YOU YOU ALWAYS WERE A DUMB SACK OF LARD",
          data.error
        );
      }
    } catch (e) {
      setAlertMsg("Error transferring Ownership");
      setAlertButtonMsg("Ok");
      setFunction1(() => () => window.location.reload());
      setShowAlert(true);
      console.error("error transffering owenrship", e);
    }
  };

  const removeMember = async (memberToRemove: PartialHackerModel) => {
    if (!hacker || !team) {
      console.error("TS MISSING");
      return;
    }

    try {
      const removeRes = await fetch(`${uri}team/removeTeamMember`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          owner: owner?.UUID,
          teamMember: memberToRemove?.UUID,
          teamID: team.teamID,
        }),
      });
      const data = await removeRes.json();
      console.log(data);
      if (data.status === 200) {
        setAlertMsg(
          memberToRemove.firstName +
            " " +
            memberToRemove.lastName +
            " successfully removed from your team."
        );
        setAlertButtonMsg("Ok");
        setFunction1(() => () => window.location.reload());
        setShowAlert(true);
      } else {
        console.error("error removing member", data.error);
      }
    } catch (e) {
      setAlertMsg("Error removing member");
      setAlertButtonMsg("Ok");
      setFunction1(() => () => window.location.reload());
      setShowAlert(true);
      console.error("error removing member", e);
    }
  };

  const leaveTeam = async () => {
    if (!hacker || !team) {
      console.error("TS MISSING");
      return;
    }

    try {
      const leaveRes = await fetch(`${uri}team/leave`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamID: team.teamID,
          teamMember: hacker.UUID,
        }),
      });
      const data = await leaveRes.json();
      console.log(data);
      if (data.status === 200) {
        setAlertMsg("Successfully left your team.");
        setAlertButtonMsg("Ok");
        setFunction1(() => () => window.location.reload());
        setShowAlert(true);
      } else {
        console.error("you can't leave gang 😂😂😂", data.error);
      }
    } catch (e) {
      setAlertMsg("Error leaving");
      setAlertButtonMsg("Ok");
      setShowAlert(true);
      setFunction1(() => () => window.location.reload());
      console.error("you can't leave gang 😂😂😂", e);
    }
  };

  const deleteTeam = async () => {
    if (!hacker || !team) {
      console.error("TS MISSING");
      return;
    }

    try {
      const deleteRes = await fetch(`${uri}team`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamID: team.teamID,
          owner: hacker.UUID,
        }),
      });
      const data = await deleteRes.json();
      console.log(data);
      if (data.status === 200) {
        setAlertMsg("Successfully deleted your team.");
        setAlertButtonMsg("Ok");
        setFunction1(() => () => window.location.reload());
        setShowAlert(true);
      } else {
        console.error("u cnt dlt ts gng 😂😂😂", data.error);
      }
    } catch (e) {
      setAlertMsg("Error deleting team");
      setAlertButtonMsg("Ok");
      setFunction1(() => () => window.location.reload());
      setShowAlert(true);
      console.error("u cnt dlt ts gng 😂😂😂", e);
    }
  };
  const displayContact = (hacker: PartialHackerModel) => {
    setShowContact(true);
    setContactContent(hacker);
    return;
  };
  const closeContact = () => {
    setShowContact(false);
    setContactContent(null);
  };

  return (
    <>
      {team && (
        <div className="h-[85vh] bg-[#C7D1EB] flex items-center justify-center">
          <div
            id=""
            className="min-h-[60vh] w-[77vw] pl-8 pt-4 pb-4 pr-4 bg-white rounded-4xl flex flex-col items-shadow-xl align-middle"
          >
            <h1 className="mt-2 md:mt-5 relative font-bold text-[2rem] md:text-[3.5rem]">
              {team.teamName}
            </h1>
            <h2 className="relative font-bold text-md md:text-2xl">
              Access Code: {team.teamID}
            </h2>
            <h3 className="relative font-bold text-md md:text-xl">
              Application Status:{" "}
            </h3>
            <div className="flex flex-col gap-12 mt-5">
              {owner && (
                <div className="flex flex-row justify-between">
                  <div className="flex flex-col md:flex-row items-start justify-center md:items-center gap-1">
                    <h4 className="text-[1.2rem]">Owner:</h4>
                    <h4 className="text-[1.4rem] md:text-[1.7rem] font-semibold">
                      {owner.firstName} {owner.lastName}
                    </h4>
                  </div>
                  <div className="inline-flex w-auto justify-end items-center">
                    <button
                      className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                      onClick={() => displayContact(owner)}
                    >
                      <span className="block sm:hidden text-sm">✉</span>
                      <span className="hidden sm:block text-center">
                        Contact Info
                      </span>
                    </button>
                  </div>
                </div>
              )}
              {teamMember1 && (
                <div className="flex flex-row justify-between">
                  <div className="flex flex-col md:flex-row items-start justify-center md:items-center gap-1">
                    <h4 className="text-[1.2rem]">Teammate:</h4>
                    <h4 className="text-[1.4rem] md:text-[1.7rem] font-semibold">
                      {teamMember1.firstName} {teamMember1.lastName}
                    </h4>
                  </div>
                  {teamMember1?.UUID !== null ? (
                    <div className="inline-flex w-auto justify-end items-center gap-2">
                      <button
                        className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                        onClick={() =>
                          teamMember1 && displayContact(teamMember1)
                        }
                      >
                        <span className="block sm:hidden text-sm">✉</span>
                        <span className="hidden sm:block text-center">
                          Contact Info
                        </span>
                      </button>
                      {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                        <button
                          className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                          onClick={() =>
                            teamMember1 &&
                            makeOwnerAlertFirstBecauseFuckingMobileHasToLikeNeedAnAlert(
                              teamMember1
                            )
                          }
                        >
                          <span className="block sm:hidden text-sm">♕</span>
                          <span className="hidden sm:block text-center">
                            Make Owner
                          </span>
                        </button>
                      ) : (
                        ""
                      )}
                      {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                        <button
                          className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none foc[1.1rem]:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-[1.1rem] w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                          onClick={() =>
                            teamMember1 && removeMember(teamMember1)
                          }
                        >
                          <span className="block sm:hidden text-sm">✕</span>
                          <span className="hidden sm:block text-center">
                            Remove Member
                          </span>
                        </button>
                      ) : (
                        ""
                      )}
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              )}
              {teamMember2 && (
                <div className="flex flex-row justify-between">
                  <div className="flex flex-col md:flex-row items-start justify-center md:items-center gap-1">
                    <h4 className="text-[1.2rem]">Teammate:</h4>
                    <h4 className="text-[1.4rem] md:text-[1.7rem] font-semibold">
                      {teamMember2.firstName} {teamMember2.lastName}
                    </h4>
                  </div>
                  {teamMember2?.UUID !== null ? (
                    <div className="inline-flex w-auto justify-end items-center gap-2">
                      <button
                        className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                        onClick={() =>
                          teamMember2 && displayContact(teamMember2)
                        }
                      >
                        <span className="block sm:hidden text-sm">✉</span>
                        <span className="hidden sm:block text-center">
                          Contact Info
                        </span>
                      </button>
                      {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                        <button
                          className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                          onClick={() =>
                            teamMember2 &&
                            makeOwnerAlertFirstBecauseFuckingMobileHasToLikeNeedAnAlert(
                              teamMember2
                            )
                          }
                        >
                          <span className="block sm:hidden text-sm">♕</span>
                          <span className="hidden sm:block text-center">
                            Make Owner
                          </span>
                        </button>
                      ) : (
                        ""
                      )}
                      {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                        <button
                          className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-[1.1rem] w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                          onClick={() =>
                            teamMember2 && removeMember(teamMember2)
                          }
                        >
                          <span className="block sm:hidden text-sm">✕</span>
                          <span className="hidden sm:block text-center">
                            Remove Member
                          </span>
                        </button>
                      ) : (
                        ""
                      )}
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              )}

              {teamMember3 && (
                <div className="flex flex-row justify-between">
                  <div className="flex flex-col md:flex-row items-start justify-center md:items-center gap-1">
                    <h4 className="text-[1.2rem]">Teammate:</h4>
                    <h4 className="text-[1.4rem] md:text-[1.7rem] font-semibold">
                      {teamMember3.firstName} {teamMember3.lastName}
                    </h4>
                  </div>
                  {teamMember3?.UUID !== null ? (
                    <div className="inline-flex w-auto justify-end items-center gap-2">
                      <button
                        className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                        onClick={() =>
                          teamMember3 && displayContact(teamMember3)
                        }
                      >
                        <span className="block sm:hidden text-sm">✉</span>
                        <span className="hidden sm:block text-center">
                          Contact Info
                        </span>
                      </button>
                      {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                        <button
                          className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                          onClick={() =>
                            teamMember3 &&
                            makeOwnerAlertFirstBecauseFuckingMobileHasToLikeNeedAnAlert(
                              teamMember3
                            )
                          }
                        >
                          <span className="block sm:hidden text-sm">♕</span>
                          <span className="hidden sm:block text-center">
                            Make Owner
                          </span>
                        </button>
                      ) : (
                        ""
                      )}
                      {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                        <button
                          className="text-[#F8FAFC] bg-[#1E293B] hover:bg-[#64748B] focus:outline-none focus:ring[1.1rem] focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-[1.1rem] w-[10vw] h-[5vh] sm:px-1 relative overflow-hidden anmat-th-bttn-gng"
                          onClick={() =>
                            teamMember3 && removeMember(teamMember3)
                          }
                        >
                          <span className="block sm:hidden text-sm">✕</span>
                          <span className="hidden sm:block text-center">
                            Remove Member
                          </span>
                        </button>
                      ) : (
                        ""
                      )}
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end align-end mt-auto">
              <div className="relative inset-0 flex flex-col-reverse items-center md:flex-row md:justify-between md:mb-5 md:mr-2 w-[100vw]">
                {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                  <div>
                    <button
                      type="button"
                      className="text-[#F8FAFC] bg-blue-400 hover:bg-[#64748B] focus:outline-none focus:ring-4 focus:ring-[#0EA5E9] font-bold rounded-lg text-sm sm:text-xl w-[45vw] h-[5vh] md:w-[12vw] md:h-[7vh] relative overflow-hidden anmat-th-bttn-gng"
                    >
                      Submit Team
                    </button>
                  </div>
                ) : (
                  ""
                )}
                <div
                  className={`flex gap-1 my-1 ${
                    hacker?.UUID === parseInt(owner?.UUID ?? "")
                      ? "items-center"
                      : "md:ml-auto"
                  }`}
                >
                  {teamMember1?.UUID !== null ? (
                    <button
                      type="button"
                      className="focus:outline-none text-white bg-yellow-500 font-medium rounded-lg text-sm px-5 py-2.5"
                      onClick={leaveTeam}
                    >
                      Leave Team
                    </button>
                  ) : (
                    ""
                  )}
                  {hacker?.UUID === parseInt(owner?.UUID ?? "") ? (
                    <button
                      type="button"
                      className="focus:outline-none text-white bg-red-500 font-medium rounded-lg text-sm px-5 py-2.5"
                      onClick={deleteTeam}
                    >
                      Delete Team
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </div>
            {showAlert && (
              <Alert
                msg={alertMsg}
                function1={function1 ?? (() => {})}
                message1={alertButtonMsg}
                function2={function2 ?? (() => {})}
                message2={alertButtonMsg2}
              />
            )}
            {showContact && contactContent && (
              <Contact hacker={contactContent} onClose={closeContact} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ManageTeam;
