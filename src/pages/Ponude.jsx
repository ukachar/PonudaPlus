import React from "react";
import { databases } from "../../appwriteConfig";

const Ponude = () => {
  let promise = databases.listDocuments(
    import.meta.env.VITE_APPWRITE_DATABASE,
    import.meta.env.VITE_APPWRITE_PONUDE_COLLECTION,
    []
  );

  promise.then(
    function (response) {
      console.log(response);
    },
    function (error) {
      console.log(error);
    }
  );
  return (
    <div className="overflow-x-auto w-10/12 mx-auto">
      <table className="table ">
        {/* head */}
        <thead>
          <tr>
            <th>Broj ponude</th>
            <th>Kupac</th>
            <th>Iznos</th>

            <th></th>
          </tr>
        </thead>
        <tbody>
          {/* row 1 */}
          <tr className="hover">
            <th>1</th>
            <td>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold">Hart Hagerty</div>
                  <div className="text-sm opacity-50">United States</div>
                </div>
              </div>
            </td>
            <td>
              Zemlak, Daniel and Leannon
              <br />
              <span className="badge badge-ghost badge-sm">
                Desktop Support Technician
              </span>
            </td>

            <th>
              <button className="btn btn-ghost btn-xs">details</button>
            </th>
          </tr>
          {/* row 2 */}
          <tr className="hover">
            <th>1</th>
            <td>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold">Brice Swyre</div>
                  <div className="text-sm opacity-50">China</div>
                </div>
              </div>
            </td>
            <td>
              Carroll Group
              <br />
              <span className="badge badge-ghost badge-sm">Tax Accountant</span>
            </td>

            <th>
              <button className="btn btn-ghost btn-xs">details</button>
            </th>
          </tr>
        </tbody>
        {/* foot */}
        <tfoot>
          <tr>
            <th>Name</th>
            <th>Job</th>
            <th>Favorite Color</th>
            <th></th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default Ponude;
