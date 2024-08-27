from datetime import datetime
import random
from pymongo import MongoClient
from bson.objectid import ObjectId
import traceback
from flask import Flask, jsonify, abort, make_response, request
from flask_cors import CORS


conex = MongoClient(host=['127.0.0.1:27017'])
conexDB = conex.apiData_02
app = Flask(__name__)
CORS(app)
wsgi_app = app.wsgi_app


def token():
    ahora = datetime.now()
    antes = datetime.strptime("1970-01-01", "%Y-%m-%d")
    return str(hex(abs((ahora - antes).seconds) * random.randrange(10000000)).split('x')[-1]).upper()

# -------------------------------------------------------
# Error control, httpRequest rules
# -------------------------------------------------------
def error_response(message, status_code):
    response = jsonify({'error': message})
    return make_response(response, status_code)

@app.errorhandler(400)
def bad_request(error):
    return error_response('Bad request', 400)

@app.errorhandler(401)
def unauthorized(error):
    return error_response('Unauthorized', 401)

@app.errorhandler(403)
def forbidden(error):
    return error_response('Forbidden', 403)

@app.errorhandler(404)
def not_found(error):
    return error_response('Not found', 404)

@app.errorhandler(500)
def internal_server_error(error):
    return error_response('Internal Server Error', 500)


# -----------------------------------------------------
# Create routes and intereste user control functions
# -----------------------------------------------------

#Insertar un interested
@app.route('/interested', methods=['POST'])
def create_user():
    if not request.json or \
            not 'name' in request.json or \
            not 'email' in request.json or \
            not 'cellphone' in request.json or \
            not 'passwd' in request.json:
        abort(400)

    user = {
        'name': request.json['name'],
        'email': request.json['email'],
        'cellphone': request.json['cellphone'],
        'passwd': request.json['passwd']
    }
    try:
        result = conexDB.interested.insert_one(user)
        user2 = {
            'token':str(result.inserted_id),
            'name': request.json['name']
        }
        data = {
            "status_code": 201,
            "status_message": "Data was created",
            "data": {'interested': user2}
        }
    except Exception as expc:
        abort(500)
    return jsonify(data), 201

#Actualizar un interested
@app.route('/interested/<string:token>', methods=['PUT'])
def update_user(token):
    if not request.json or \
            not 'name' in request.json or \
            not 'email' in request.json or \
            not 'cellphone' in request.json:
        abort(400)

    try:
        datos = conexDB.interested.find_one({"_id":ObjectId(token)})
        if datos == None:
            abort(404)

        conexDB.interested.update_one({'_id':ObjectId(token)},
                                     {'$set':{'name':request.json.get('name', datos['name']),
                                              'email':request.json.get('email', datos['email']),
                                              'cellphone':request.json.get('cellphone', datos['cellphone'])}})        

    except Exception as expc:
        abort(404)

    datos2 = {'name':request.json.get('name', datos['name']),
              'email':request.json.get('email', datos['email']),
              'cellphone':request.json.get('cellphone', datos['cellphone'])}

    data = {
        "status_code": 200,
        "status_message": "Ok",
        "data": datos2
    }
    return jsonify(data), 201

#Obtener un interested
@app.route('/<string:token>/me', methods=['GET'])
def get_user(token):
    try:
        user = conexDB.interested.find_one({"_id":ObjectId(token)})

        if user == None:
            abort(404)

        data = {
            "status_code": 200,
            "status_message": "Ok",
            "data": {'user': {"name": user['name'],
                              "email": user['email'],
                              "cellphone": user['cellphone'],
                              }
                    }
        }
    except Exception as expc:
        abort(404)
    return jsonify(data)

#Eliminar un interested
@app.route('/login/<string:email>/<string:passwd>', methods=['GET'])
def get_login(email, passwd):
    try:
        user = conexDB.interested.find_one({"email":{"$eq":email},"passwd":{"$eq":passwd}})
        if user == None:
            abort(404)
        data = {
            "status_code": 200,
            "status_message": "Ok",
            "data": {'user': {"name": user['name'],
                              "token": str(user['_id'])
                              }
                    }
        }
    except Exception as expc:
        abort(404)
    return jsonify(data)

# ------------------------------------------------------------------
# Procesos relacionados con el registro de atestados del interesado
# ------------------------------------------------------------------

#Insertar una certificacion
@app.route('/<string:token>/certification', methods=['POST'])
def create_certification(token):
    if not request.json or \
            not 'description' in request.json or \
            not 'category' in request.json or \
            not 'studycenter' in request.json or \
            not 'year' in request.json:
        abort(400)

    data = {
        'description': request.json['description'],
        'category': request.json['category'],
        'studycenter': request.json['studycenter'],
        'year': request.json['year'],
        'token': token
    }
    try:
        result = conexDB.certification.insert_one(data)
        data2 = {
            'id': str(result.inserted_id),
            'description': request.json['description'],
            'category': request.json['category'],
            'studycenter': request.json['studycenter'],
            'year': request.json['year'],
            'token': token
        }
        salida = {
            "status_code": 201,
            "status_message": "Data was created",
            "data": data2
        }
    except Exception as expc:
        abort(500)
    return jsonify({'customer': salida}), 201

#Obtener todas las certificaciones de un interested
@app.route('/<string:token>/certification', methods=['GET'])
def get_customers(token):
    try:
        datos = list(conexDB.certification.find({"token": {"$eq": token}}))
        
        if not datos:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "error": "No certification records found for the given token."
            }
        else:
            data = {
                "status_code": 200,
                "status_message": "OK",
                "data": [
                    {
                        "id": str(doc['_id']),
                        "description": doc['description'],
                        "category": doc['category'],
                        "studycenter": doc['studycenter'],
                        "year": doc['year'],
                        "token": doc['token']
                    } for doc in datos
                ]
            }
    except Exception as e:
        app.logger.error(f"Error getting customers: {str(e)}")
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        data = {
            "status_code": 500,
            "status_message": "Internal Server Error",
            "error": "An error occurred while retrieving the certification list."
        }
    return jsonify(data)

#Obtener una certificacion de un interested
@app.route('/<string:token>/certification/<string:cus_id>', methods=['GET'])
def get_customer_id(token, cus_id):
    try:
        datos = conexDB.certification.find_one({"token":token,"_id":ObjectId(cus_id)})

        if datos == None:
            data = {
                "status_code": 404,
                "status_message": "Ok",
                "data": "Certification data not found"
            }
        else:
            data = {
                "status_code": 200,
                "status_message": "Ok",
                "data": {"id": str(datos['_id']),
                        "description": datos['description'],
                        "category": datos['category'],
                        "studycenter": datos['studycenter'],
                        "year": datos['year'],
                        "token":datos['token']}
            }
    except Exception as expc:
        abort(404)
    return jsonify(data)


#Actualizar una certificacion
@app.route('/<string:token>/certification/<string:cus_id>', methods=['PUT'])
def update_customer(token, cus_id):
    try:
        datos = conexDB.certification.find_one({"token":token,"_id":ObjectId(cus_id)})
        if datos == None:
            abort(404)
        if not request.json:
            abort(400)
        if 'description' in request.json and request.json['description'] == '':
            abort(400)
        if 'category' in request.json and request.json['category'] == '':
            abort(400)
        if 'studycenter' in request.json and request.json['studycenter'] == '':
            abort(400)
        if 'year' in request.json and request.json['year'] == '':
            abort(400)

        conexDB.certification.update_one({'_id':ObjectId(cus_id)},
                                    {'$set':{'description':request.json.get('description', datos['description']),
                                             'category':request.json.get('category', datos['category']),
                                             'studycenter':request.json.get('studycenter', datos['studycenter']),
                                             'year':request.json.get('year', datos['year'])}})
    except Exception as expc:
        abort(404)

    datos2 = {'description':request.json.get('description', datos['description']),
                'category':request.json.get('category', datos['category']),
                'studycenter':request.json.get('studycenter', datos['studycenter']),
                'year':request.json.get('year', datos['year'])}

    data = {
        "status_code": 200,
        "status_message": "Ok",
        "data": datos2
    }

    return jsonify(data), 200

#Eliminar una certificacion
@app.route('/<string:token>/certification/<string:cus_id>', methods=['DELETE'])
def delete_customer(token, cus_id):
    try:
        datos = conexDB.certification.find_one({"token":token,"_id":ObjectId(cus_id)})
        if datos == None:
            abort(404)
        conexDB.certification.delete_one({'_id':ObjectId(cus_id)})

    except Exception as expc:
        abort(404)
    return jsonify({'result': True})

#Insertar una empresa
@app.route('/enterprise', methods=['POST'])
def create_enterprise():
    if not request.json or \
            not 'name' in request.json or \
            not 'url' in request.json or \
            not 'callcenter' in request.json or \
            not 'address' in request.json or \
            not 'email' in request.json or \
            not 'passwd' in request.json:  
        abort(400)

    enter = {
        'name': request.json['name'],
        'url': request.json['url'],
        'callcenter': request.json['callcenter'],
        'address': request.json['address'],
        'email': request.json['email'],
        'passwd': request.json['passwd']
    }
    try:
        result = conexDB.enterprise.insert_one(enter)
        enter2 = {
            'token': str(result.inserted_id),
            'name': request.json['name']
        }
        data = {
            "status_code": 201,
            "status_message": "Data was created",
            "data": {'enterprise': enter2}
        }
    except Exception as expc:
        abort(500)
    return jsonify(data), 201

#NUEVA RUTA PARA LOGIN DE EMPRESAS
@app.route('/enterprise_login/<string:email>/<string:passwd>', methods=['GET'])
def get_enterprise_login(email, passwd):
    try:
        enterprise = conexDB.enterprise.find_one({"email": {"$eq": email}, "passwd": {"$eq": passwd}})
        if enterprise is None:
            abort(404)
        data = {
            "status_code": 200,
            "status_message": "Ok",
            "data": {'enterprise': {
                "name": enterprise['name'],
                "token": str(enterprise['_id'])
            }}
        }
    except Exception as expc:
        abort(404)
    return jsonify(data)


#Se quita el campo 'Security' para disminuir la complejidad del objeto JSON
@app.route('/enterprise/<string:token>', methods=['PUT'])
def update_enterprise(token):
    if not request.json or \
            not 'name' in request.json or \
            not 'url' in request.json or \
            not 'callcenter' in request.json or \
            not 'address' in request.json:
        abort(400)

    try:
        datos = conexDB.enterprise.find_one({"_id": ObjectId(token)})
        if datos is None:
            abort(404)

        conexDB.enterprise.update_one({'_id': datos['_id']},
                                      {'$set': {'name': request.json.get('name', datos['name']),
                                                'url': request.json.get('url', datos['url']),
                                                'callcenter': request.json.get('callcenter', datos['callcenter']),
                                                'address': request.json.get('address', datos['address'])}})
    except Exception as expc:
        abort(404)

    datos2 = {'name': request.json.get('name', datos['name']),
              'url': request.json.get('url', datos['url']),
              'callcenter': request.json.get('callcenter', datos['callcenter']),
              'address': request.json.get('address', datos['address'])}

    data = {
        "status_code": 200,
        "status_message": "Ok",
        "data": datos2
    }

    return jsonify(data), 200

#Obtener una empresa
@app.route('/enterprise/<string:token>', methods=['GET'])
def get_enterprises(token):
    try:
        datos = conexDB.enterprise.find_one({'_id': ObjectId(token)})

        if datos is None:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "data": "Enterprise not found"
            }
            return jsonify(data), 404
        else:
            dts = {
                "name": datos['name'],
                "url": datos['url'],
                "callcenter": datos['callcenter'],
                "address": datos['callcenter']
            }

            data = {
                "status_code": 200,
                "status_message": "Ok",
                "data": dts
            }
    except:
        abort(500)
    return jsonify(data)

#Obtener todas las empresas
@app.route('/enterprise', methods=['GET'])
def get_all_enterprises():
    try:
        datos = conexDB.enterprise.find()

        if datos is None:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "data": "The enterprise list is empty"
            }
            return jsonify(data), 404
        else:
            lista = []
            for collect in datos:
                empresa = {
                    "token": str(collect['_id']),
                    "name": collect['name'],
                    "url": collect['url'],
                    "callcenter": collect['callcenter'],
                    "address": collect['address']
                }
                lista.append(empresa)

            data = {
                "status_code": 200,
                "status_message": "Ok",
                "data": lista
            }
    except:
        abort(500)
    return jsonify(data)

#Eliminar una empresa
@app.route('/enterprise/<string:token>', methods=['DELETE'])
def delete_enterprise(token):
    try:
        result = conexDB.enterprise.delete_one({'_id': ObjectId(token)})
        if result.deleted_count == 0:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "data": "Enterprise not found"
            }
            return jsonify(data), 404
        else:
            data = {
                "status_code": 200,
                "status_message": "Ok",
                "data": "Enterprise deleted successfully"
            }
            return jsonify(data), 200
    except:
        abort(500)

# ------------------------------------------------------------ 
# Procesos relacionados con el control de puestos disponibles
# ------------------------------------------------------------

#Insertar un puesto de trabajo
@app.route('/job', methods=['POST'])
def create_job():
    if not request.json or \
       not 'enterprise' in request.json or \
       not 'titlejob' in request.json or \
       not 'description' in request.json or \
       not 'hiringtype' in request.json or \
       not 'salary' in request.json or \
       not 'requirements' in request.json:
        abort(400)

    data = {
        'enterprise': request.json['enterprise'],
        'titlejob': request.json['titlejob'],
        'description': request.json['description'],
        'hiringtype': request.json['hiringtype'],
        'salary': request.json['salary'],  #Se agrega el campo salary para cumplir con los requerimientos del proyecto
        'requirements': request.json['requirements'],
        'interested_people': []   #Se agrega el campo interested_people para cumplir con los requerimientos del proyecto
    }

    try:
        datos = conexDB.enterprise.find_one({"_id": ObjectId(request.json['enterprise'])})
        if datos == None:
            abort(404)
        result = conexDB.jobs.insert_one(data)
        data2 = {
            #Se quita el campo 'Security' para disminuir la complejidad del objeto JSON
            'id': str(result.inserted_id),
            'enterprise': request.json['enterprise'],
            'titlejob': request.json['titlejob'],
            'description': request.json['description'],
            'hiringtype': request.json['hiringtype'],
            'salary': request.json['salary'],  #Se agrega el campo salary para cumplir con los requerimientos del proyecto
            'requirements': request.json['requirements'],
            'interested_people': []  #Se agrega el campo interested_people para cumplir con los requerimientos del proyecto
        }
        salida = {
            "status_code": 201,
            "status_message": "Data was created",
            "data": data2
        }
    except Exception as expc:
        abort(500)

    return jsonify({'job': salida}), 201

#NUEVA RUTA PARA AGREGAR INTERESADOS A UN PUESTO DE TRABAJO
@app.route('/job/<string:job_id>', methods=['PUT'])
def apply_for_job(job_id):
    try:
        job_data = conexDB.jobs.find_one({'_id': ObjectId(job_id)})
        if job_data is None:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "data": "Job not found"
            }
            return jsonify(data), 404

        user_id = request.json.get('userId')

        if user_id and user_id not in job_data.get('interested_people', []):
            conexDB.jobs.update_one(
                {'_id': ObjectId(job_id)},
                {'$push': {'interested_people': user_id}}
            )

        update_fields = {}
        for field in ['enterprise', 'titlejob', 'description', 'hiringtype', 'salary', 'requirements']:
            if field in request.json:
                update_fields[field] = request.json[field]

        if update_fields:
            conexDB.jobs.update_one(
                {'_id': ObjectId(job_id)},
                {'$set': update_fields}
            )

        updated_job_data = conexDB.jobs.find_one({'_id': ObjectId(job_id)})

        data = {
            "status_code": 200,
            "status_message": "Ok",
            "data": {
                'id': str(updated_job_data['_id']),
                'enterprise': updated_job_data['enterprise'],
                'titlejob': updated_job_data['titlejob'],
                'description': updated_job_data['description'],
                'hiringtype': updated_job_data['hiringtype'],
                'salary': updated_job_data['salary'],
                'requirements': updated_job_data['requirements'],
                'interested_people': updated_job_data['interested_people']
            }
        }
    except:
        abort(500)

    return jsonify(data)

#NUEVA RUTA PARA OBTENER LOS PUESTOS DE TRABAJO DE UNA EMPRESA
@app.route('/job/<string:enterprise_token>', methods=['GET'])
def get_jobs_by_enterprise(enterprise_token):
    try:
        jobs_data = conexDB.jobs.find({'enterprise': enterprise_token})
        job_list = []
        for job_data in jobs_data:
            job_item = {
                'id': str(job_data['_id']),
                'enterprise': job_data['enterprise'],
                'titlejob': job_data['titlejob'],
                'description': job_data['description'],
                'hiringtype': job_data['hiringtype'],
                'salary': job_data.get('salary'),
                'requirements': job_data['requirements'],
                'interested_people': job_data['interested_people'] 
            }
            job_list.append(job_item)
        
        if job_list:
            data = {
                "status_code": 200,
                "status_message": "Ok",
                "data": job_list
            }
        else:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "data": "Jobs not found for this enterprise"
            }
            return jsonify(data), 404
    except Exception as e:
        error_message = f"Error fetching jobs: {str(e)}"
        data = {
            "status_code": 500,
            "status_message": "Internal Server Error",
            "data": error_message
        }
        return jsonify(data), 500

    return jsonify(data)

#NUEVA RUTA PARA OBTENER UN PUESTO DE TRABAJO POR ID
@app.route('/jobID/<string:job_id>', methods=['GET'])
def get_job_by_id(job_id):
    try:
        job_data = conexDB.jobs.find_one({'_id': ObjectId(job_id)})
        if job_data:
            job_item = {
                'id': str(job_data['_id']),
                'enterprise': job_data['enterprise'],
                'titlejob': job_data['titlejob'],
                'description': job_data['description'],
                'hiringtype': job_data['hiringtype'],
                'salary': job_data.get('salary'),
                'requirements': job_data['requirements'],
                'interested_people': job_data['interested_people']
            }
            data = {
                "status_code": 200,
                "status_message": "Ok",
                "data": job_item
            }
        else:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "data": "Job not found with the specified ID"
            }
            return jsonify(data), 404
    except Exception as e:
        error_message = f"Error fetching job: {str(e)}"
        data = {
            "status_code": 500,
            "status_message": "Internal Server Error",
            "data": error_message
        }
        return jsonify(data), 500

    return jsonify(data)

#NUEVA RUTA PARA OBTENER TODOS LOS PUESTOS DE TRABAJO
@app.route('/job', methods=['GET'])
def get_all_jobs():
    try:
        job_data = conexDB.jobs.find()
        if job_data is None:
            data = {
                "status_code": 404,
                "status_message": "Not Found",
                "data": "No jobs found"
            }
            return jsonify(data), 404
        else:
            jobs_list = []
            for job in job_data:
                job_item = {
                    'id': str(job['_id']),
                    'enterprise': job['enterprise'],
                    'titlejob': job['titlejob'],
                    'description': job['description'],
                    'hiringtype': job['hiringtype'],
                    'salary': job['salary'], 
                    'requirements': job['requirements'],
                    'interested_people': job['interested_people']  
                }
                jobs_list.append(job_item)
            data = {
                "status_code": 200,
                "status_message": "Ok",
                "data": jobs_list
            }
    except:
        abort(500)

    return jsonify(data)

#NUEVA RUTA PARA ELIMINAR UN PUESTO DE TRABAJO
@app.route('/job/<string:job_id>', methods=['DELETE'])
def delete_job(job_id):
    try:
        job = conexDB.jobs.find_one({'_id': ObjectId(job_id)})
        if job is None:
            return jsonify({'error': 'Job not found.'}), 404  

        result = conexDB.jobs.delete_one({'_id': ObjectId(job_id)})

        if result.deleted_count == 1:
            return jsonify({'status_code': 200, 'status_message': f'Job with ID {job_id} has been deleted successfully.'}), 200
        else:
            return jsonify({'error': 'Failed to delete job.'}), 500
    except Exception as e:
        return jsonify({'error': 'Internal Server Error.'}), 500

if __name__ == '__main__':
    HOST = '0.0.0.0'
    PORT = 5001
    app.run(HOST, PORT)