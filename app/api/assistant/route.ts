import { NextResponse } from "next/server";
import OpenAI from "openai";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export async function POST(request: Request) {


  try {


    const body = await request.json();


    const question = body.question;
    const rapport = body.rapport;



    const completion = await openai.chat.completions.create({

      model: "gpt-4.1-mini",

      messages: [

        {
          role: "system",
          content:
          `
          Tu es Diabia, un assistant d'analyse de données de glycémie.

          Tu aides à comprendre les données.
          Tu expliques simplement.
          Tu ne modifies jamais un traitement et tu ne donnes pas de dose d'insuline.

          Structure tes réponses :

          1) Ce que tu observes
          2) Ce que cela peut signifier
          3) Une piste générale d'amélioration
          `
        },


        {
          role: "user",
          content:

          `
          Données utilisateur :

          ${JSON.stringify(rapport)}


          Question :

          ${question}

          `
        }

      ]

    });



    return NextResponse.json({

      reponse:
      completion.choices[0].message.content

    });



  }

  catch(error:any){

    console.error("ERREUR IA :", error);

    return NextResponse.json({

      reponse:
      "Erreur IA : " + error.message

    });

}


}