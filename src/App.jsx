import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";

const updateUsers = (setUsers, instance, accounts) => {
  if (accounts.length > 0) {
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        fetch(
          "https://graph.microsoft.com/v1.0/users?$select=id,displayName,extension_24a8955a629c4869b36185a566f48b4a_Admin",
          {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }
        )
          .then(async (res) => await res.json())
          .then((response) => {
            console.log(response.value);
            setUsers(response.value);
          })
          .catch((error) => {
            console.error(error);
          });
      });
  }
};
function MyComponent() {
  const { instance, accounts } = useMsal();
  const [loginMenu, setLoginMenu] = useState();
  const [authenticatedUser, setUser] = useState();
  const [users, setUsers] = useState([]);
  const [editAdmins, openAdministrators] = useState(false);
  const [selection, setSelection] = useState("");
  const [selector, setSelector] = useState("");
  const [generalLedger, setGeneralLedger] = useState(null);
  const [payoutLog, setPayoutLog] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      instance
        .acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        .then((response) => {
          fetch(
            `https://graph.microsoft.com/v1.0/users/${accounts[0].localAccountId}?$select=id,displayName,extension_24a8955a629c4869b36185a566f48b4a_Admin`,
            {
              headers: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            }
          )
            .then(async (res) => await res.json())
            .then((response) => {
              console.log("authenticatedUser", response);
              setUser(response);
            })
            .catch((error) => {
              console.error(error);
            });
        });
    }
  }, [instance, accounts]);

  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <div
        style={{
          fontWeight: "bolder",
          color: "white",
          backgroundColor: "orange",
          width: "300px",
          height: "100vh",
          transition: ".3s ease-out",
        }}
      >
        <div style={{ padding: "10px" }}>RAI Financial</div>
        <div
          style={{
            textAlign: "center",
            margin: "10px",
            borderRadius: "8px",
            padding: "10px",
            backgroundColor: "rgba(250,250,250,0.25)",
          }}
        >
          {accounts[0] ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  display: "block",
                  textAlign: "center",
                  borderRadius: "10px",
                  backgroundColor: "white",
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    margin: "auto",
                    width: "10px",
                    height: "10px",
                    borderRadius: "10px",
                    backgroundColor: "orange",
                  }}
                ></div>
                <div
                  style={{
                    width: "20px",
                    height: "12px",
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    backgroundColor: "orange",
                  }}
                ></div>
              </div>
              &nbsp;&nbsp;
              {accounts[0].username}
            </div>
          ) : (
            <button onClick={() => instance.loginPopup()}>login</button>
          )}
        </div>
        {!authenticatedUser ? (
          <div style={{ padding: "0px 10px" }}>
            Must be logged in to view this page.
          </div>
        ) : !authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin ? (
          <div style={{ padding: "0px 10px" }}>
            Must be an admin to view this page.
          </div>
        ) : (
          <div>
            <ul
              style={{
                cursor: "pointer",
                color: "darkcyan",
              }}
            >
              <li
                onMouseLeave={(e) => setSelector("")}
                onMouseEnter={(e) => setSelector("I/S")}
                style={{
                  textDecoration: selection === "I/S" ? "underline" : "none",
                  listStyleType: selector === "I/S" ? "initial" : "none",
                }}
                onClick={() => setSelection("I/S")}
              >
                I/S
              </li>
              <li
                onMouseEnter={(e) => setSelector("General Ledger")}
                style={{
                  textDecoration:
                    selection === "General Ledger" ? "underline" : "none",
                  listStyleType:
                    selector === "General Ledger" ? "initial" : "none",
                }}
                onClick={() => {
                  setSelection("General Ledger");
                  setGeneralLedger([{ Amount: "loading..." }]);
                  instance
                    .acquireTokenSilent({
                      ...loginRequest,
                      account: accounts[0],
                    })
                    .then((response) => {
                      fetch(
                        "https://raifinancial.azurewebsites.net/api/generalledger",
                        {
                          method: "GET",
                          headers: {
                            Authorization: "Bearer " + response.idToken,
                            "Content-Type": "application/JSON",
                          },
                        }
                      )
                        .then(async (res) => await res.json())
                        .then((result) => {
                          console.log(result);
                          setGeneralLedger(result.generalLedger);
                        });
                    });
                }}
              >
                General Ledger
              </li>
              <li
                onMouseEnter={(e) => setSelector("Charts")}
                style={{
                  textDecoration: selection === "Charts" ? "underline" : "none",
                  listStyleType: selector === "Charts" ? "initial" : "none",
                }}
                onClick={() => setSelection("Charts")}
              >
                Charts
              </li>
              <li
                onMouseEnter={(e) => setSelector("Bank")}
                style={{
                  textDecoration: selection === "Bank" ? "underline" : "none",
                  listStyleType: selector === "Bank" ? "initial" : "none",
                }}
                onClick={() => setSelection("Bank")}
              >
                Bank
              </li>
              <li
                onMouseEnter={(e) => setSelector("Payroll")}
                style={{
                  textDecoration:
                    selection === "Payroll" ? "underline" : "none",
                  listStyleType: selector === "Payroll" ? "initial" : "none",
                }}
                onClick={() => {
                  setSelection("Payroll");
                  setPayoutLog([{ EmployeeName: "loading..." }]);
                  instance
                    .acquireTokenSilent({
                      ...loginRequest,
                      account: accounts[0],
                    })
                    .then((response) => {
                      fetch(
                        "https://raifinancial.azurewebsites.net/api/payoutLog",
                        {
                          method: "GET",
                          headers: {
                            Authorization: "Bearer " + response.idToken,
                            "Content-Type": "application/JSON",
                          },
                        }
                      )
                        .then(async (res) => await res.json())
                        .then((result) => {
                          console.log(result);
                          setPayoutLog(result.payoutLog);
                        });
                    });
                }}
              >
                Payroll
              </li>
              <li
                onMouseEnter={(e) => setSelector("Invoices")}
                style={{
                  textDecoration:
                    selection === "Invoices" ? "underline" : "none",
                  listStyleType: selector === "Invoices" ? "initial" : "none",
                }}
                onClick={() => setSelection("Invoices")}
              >
                Invoices
              </li>
            </ul>
          </div>
        )}
      </div>
      <div
        style={{
          backgroundColor: "oldlace",
          display: "block",
        }}
      >
        <div
          style={{
            cursor: "pointer",
            textIndent: "20px",
            padding: "20px 0px",
            width: "calc(100vw - 300px)",
            color: "black",
            backgroundColor: "white",
          }}
        >
          <div
            onClick={() => setLoginMenu(true)}
            style={{
              transform: "translateY(-25%)",
              display: "flex",
              height: "40px",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "orange",
              borderRadius: "10px",
              position: "absolute",
              right: "0px",
              margin: "0px 10px",
            }}
          >
            <div
              style={{
                transform: "translateX(-25%)",
              }}
            >
              {accounts[0] ? accounts[0].username.substring(0, 2) : "UU"}
            </div>
          </div>
          <div
            style={{
              boxShadow: "-2px 5px 5px 1px grey",
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "10px",
              display: loginMenu ? "block" : "none",
              position: "absolute",
              right: "0px",
              margin: "0px 10px",
            }}
          >
            <div
              onClick={() => setLoginMenu(false)}
              style={{
                textIndent: "0px",
                cursor: "pointer",
                margin: "5px",
                textAlign: "center",
                borderRadius: "10px",
                height: "min-content",
                padding: "5px",
                border: "1px solid black",
              }}
            >
              x
            </div>
            {accounts.length > 0 ? (
              <div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "block", margin: "0px 10px" }}>
                    <div
                      style={{
                        margin: "auto",
                        width: "10px",
                        height: "10px",
                        borderRadius: "10px",
                        backgroundColor: "orange",
                      }}
                    ></div>
                    <div
                      style={{
                        width: "20px",
                        height: "12px",
                        borderTopLeftRadius: "8px",
                        borderTopRightRadius: "8px",
                        backgroundColor: "orange",
                      }}
                    ></div>
                  </div>
                  <p>{accounts[0].username}</p>
                </div>
                <button onClick={() => instance.logout()}>Log out</button>
                {!editAdmins ? (
                  <button
                    onClick={() => {
                      openAdministrators(true);
                      updateUsers(setUsers, instance, accounts);
                    }}
                  >
                    +/- Update admins
                  </button>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        openAdministrators(false);
                      }}
                    >
                      - Close
                    </button>
                    <ul>
                      {users.map((user) => (
                        <li
                          onClick={() => {
                            /*if (
                        !authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
                      )
                        return null;*/
                            const answer =
                              //!user.extension_24a8955a629c4869b36185a566f48b4a_Admin &&
                              window.confirm(
                                user.extension_24a8955a629c4869b36185a566f48b4a_Admin
                                  ? "Remove " +
                                      user.displayName +
                                      " as admin?" +
                                      (authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
                                        ? " You will not have administrative privileges anymore."
                                        : "")
                                  : "Would you like to make " +
                                      user.displayName +
                                      " admin? This allows them to view financial statements and approve payroll."
                              );
                            if (answer) {
                              //|| user.extension_24a8955a629c4869b36185a566f48b4a_Admin) {
                              //https://www.reddit.com/r/sysadmin/comments/1gz9evy/entra_id_custom_attribute_on_user_record/
                              instance
                                .acquireTokenSilent({
                                  ...loginRequest,
                                  account: accounts[0],
                                })
                                .then((response) => {
                                  fetch(
                                    "https://graph.microsoft.com/v1.0/users/" +
                                      user.id,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${response.accessToken}`,
                                        "Content-Type": "application/JSON",
                                      },
                                      method: "PATCH",
                                      body: JSON.stringify({
                                        extension_24a8955a629c4869b36185a566f48b4a_Admin:
                                          user.extension_24a8955a629c4869b36185a566f48b4a_Admin
                                            ? false
                                            : true,
                                      }), //8705757a8c794156ac5f7a1bf13af481
                                      //0ccab800ce534413a0e8e3619f5fd1d1
                                    }
                                  )
                                    //.then(async (res) => await res.json())
                                    .then((response) => {
                                      console.log(response);

                                      updateUsers(setUsers, instance, accounts);
                                    })
                                    .catch((error) => {
                                      console.error(error);
                                    });
                                });
                            }
                          }}
                          key={user.id}
                        >
                          {user.displayName}{" "}
                          {user.extension_24a8955a629c4869b36185a566f48b4a_Admin &&
                            "(admin)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => instance.loginPopup()}>Log in</button>
            )}
          </div>
          RAI Financial {selection}
        </div>
        {/*selection !== "" && (
          <div
            style={{
              margin: "10px",
              display: "flex",
            }}
            onClick={() => setSelection("")}
          >
            <div
              style={{
                cursor: "pointer",
                borderRadius: "8px",
                border: "1px solid black",
                width: "min-content",
                textAlign: "center",
                padding: "0px 5px",
              }}
            >
              &times;
            </div>
            &nbsp;
            {selection}
          </div>
        )*/}
        <div
          style={{
            backgroundColor: "peachpuff",
          }}
        >
          {selection === "General Ledger" && (
            <table>
              {generalLedger !== null && generalLedger.length > 0 && (
                <thead>
                  <tr>
                    <td>Amount</td>
                  </tr>
                </thead>
              )}
              <tbody>
                {generalLedger === null
                  ? ""
                  : generalLedger.length === 0
                  ? "No results"
                  : generalLedger.map((x) => {
                      return (
                        <tr>
                          <td>{x.Amount}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          )}
          {selection === "Payroll" && (
            <table>
              {payoutLog !== null && payoutLog.length > 0 && (
                <thead>
                  <tr>
                    <td>Date</td>
                    <td>Employee</td>
                    <td>Amount</td>
                  </tr>
                </thead>
              )}
              <tbody>
                {payoutLog === null
                  ? ""
                  : payoutLog.length === 0
                  ? "No results"
                  : payoutLog.map((x) => {
                      return (
                        <tr key={x.CreatedAt}>
                          <td>
                            {new Date(x.PaymentDate).toLocaleDateString()}
                          </td>
                          <td>{x.EmployeeName}</td>
                          <td>${x.AmountPaid}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          )}
        </div>
        {selection !== "" && "End of results."}
      </div>
    </div>
  );
}

export default MyComponent;

