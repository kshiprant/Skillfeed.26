import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";

export default function NotificationsPage() {

  const [notifications,setNotifications] = useState([]);
  const [loading,setLoading] = useState(true);

  const loadNotifications = async () => {
    try{

      const {data} = await api.get("/notifications");

      setNotifications(data);

    }catch(err){
      console.error("Notification load failed",err);
    }
    finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    loadNotifications();
  },[]);

  return(
    <Layout
      title="Notifications"
      subtitle="Updates about connections, messages and activity."
    >

      <section className="card">

        {loading && <p className="muted">Loading notifications...</p>}

        {!loading && notifications.length === 0 && (
          <p className="muted">No notifications yet.</p>
        )}

        {!loading && notifications.map((n)=>(
          <div key={n._id} className="request-row">

            <div>
              <strong>{n.title || "Notification"}</strong>
              <p>{n.message}</p>
            </div>

          </div>
        ))}

      </section>

    </Layout>
  );
}
