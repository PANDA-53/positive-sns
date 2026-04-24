"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // ブラウザ側でのみ実行されるようにします
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-orange-600">ログイン / 新規登録</h1>
      {origin && (
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["github"]}
          redirectTo={`${origin}/auth/callback`}
        />
      )}
    </div>
  );
}